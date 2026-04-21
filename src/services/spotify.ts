import {
  SpotifyApi,
  type Track,
  type AudioFeatures,
  type SimplifiedPlaylist,
} from '@spotify/web-api-ts-sdk';
import type { GenreOption } from '../types';

const CLIENT_ID = '2a82a87ad0d74e61b4fc554ddabbfae6';
export const REDIRECT_URI = 'https://localhost:5173/';
const SCOPES = [
  'playlist-modify-public',
  'playlist-modify-private',
  'user-read-private',
  'user-read-email',
];

// ─── SDK singleton ─────────────────────────────────────────────────────────────

let _sdk: SpotifyApi | null = null;

function sdk(): SpotifyApi {
  if (!_sdk) {
    _sdk = SpotifyApi.withUserAuthorization(CLIENT_ID, REDIRECT_URI, SCOPES);
  }
  return _sdk;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Initiates login OR handles the OAuth callback automatically.
 * Call this both when the user clicks "Connect" and on page load when
 * there is a `?code=` param in the URL.
 */
export async function authenticate(): Promise<boolean> {
  const { authenticated } = await sdk().authenticate();
  return authenticated;
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const token = await sdk().getAccessToken();
    return token !== null;
  } catch {
    return false;
  }
}

export function disconnect(): void {
  // Clear SDK auth state from localStorage
  Object.keys(localStorage)
    .filter(k => k.startsWith('spotify-sdk:'))
    .forEach(k => localStorage.removeItem(k));
  _sdk = null;
}

export function isConfigured(): boolean {
  return Boolean(CLIENT_ID);
}

// ─── Genre mappings ───────────────────────────────────────────────────────────

export const GENRE_TO_SEEDS: Record<string, string[]> = {
  'Pop':         ['pop'],
  'Hip-Hop':     ['hip-hop'],
  'Country':     ['country'],
  'Funk':        ['funk'],
  'Dance':       ['dance', 'edm'],
  'Hits':        ['pop', 'party'],
  'Rock':        ['rock'],
  'Metal':       ['metal', 'heavy-metal'],
  'Indie':       ['indie', 'indie-pop'],
  'K-Pop':       ['k-pop'],
  'J-Pop':       ['j-pop'],
  'Emo':         ['emo'],
  'Gospel':      ['gospel'],
  'R&B':         ['r-n-b', 'soul'],
  'Alternative': ['alternative'],
  'Latin':       ['latin'],
  'Punk':        ['punk', 'punk-rock'],
  'Reggae':      ['reggae'],
  'Decades':     ['pop'],
};

const GENRE_TO_CATEGORY: Record<string, string> = {
  'Pop':         'pop',
  'Hip-Hop':     'hiphop',
  'Country':     'country',
  'Funk':        'funk',
  'Dance':       'edm_dance',
  'Hits':        'toplists',
  'Rock':        'rock',
  'Metal':       'metal',
  'Indie':       'indie_alt',
  'K-Pop':       'kpop',
  'J-Pop':       'anime',
  'Emo':         'punk',
  'Gospel':      'gospel',
  'R&B':         'rnb',
  'Alternative': 'indie_alt',
  'Latin':       'latin',
  'Punk':        'punk',
  'Reggae':      'reggae',
  'Decades':     'toplists',
};

export const GENRE_BPM_PROFILE: Record<string, { typical: number; range: [number, number] }> = {
  'Pop':         { typical: 118, range: [95, 135] },
  'Hip-Hop':     { typical: 92,  range: [75, 115] },
  'Country':     { typical: 104, range: [80, 128] },
  'Funk':        { typical: 107, range: [88, 126] },
  'Dance':       { typical: 128, range: [118, 145] },
  'Hits':        { typical: 115, range: [90, 135] },
  'Rock':        { typical: 132, range: [105, 165] },
  'Metal':       { typical: 155, range: [120, 200] },
  'Indie':       { typical: 112, range: [85, 140] },
  'K-Pop':       { typical: 120, range: [95, 138] },
  'J-Pop':       { typical: 116, range: [90, 136] },
  'Emo':         { typical: 148, range: [120, 180] },
  'Gospel':      { typical: 78,  range: [58, 105] },
  'R&B':         { typical: 88,  range: [68, 108] },
  'Alternative': { typical: 124, range: [95, 158] },
  'Latin':       { typical: 104, range: [80, 132] },
  'Punk':        { typical: 168, range: [140, 210] },
  'Reggae':      { typical: 76,  range: [62, 95] },
  'Decades':     { typical: 112, range: [85, 140] },
};

const DECADE_YEAR_FILTER: Record<string, string> = {
  '70s':   'year:1970-1979',
  '80s':   'year:1980-1989',
  '90s':   'year:1990-1999',
  '2000s': 'year:2000-2009',
  '2010s': 'year:2010-2019',
  '2020s': 'year:2020-2029',
};

const TOP_CHART_PLAYLISTS = ['37i9dQZEVXbMDoHDwVN2tF', '37i9dQZEVXbLp5XoPON0wI'];

// ─── Re-exported SDK types used by playlistBuilder ────────────────────────────

export type { Track, AudioFeatures };

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function getPlaylistTracks(playlistId: string, limit = 100): Promise<Track[]> {
  try {
    const result = await sdk().playlists.getPlaylistItems(playlistId, 'US', undefined, limit as unknown as 1);
    return result.items
      .map(item => item.track)
      .filter((t): t is Track => t !== null && 'duration_ms' in t);
  } catch { return []; }
}

function dedupe(tracks: Track[]): Track[] {
  const seen = new Set<string>();
  return tracks.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true; });
}

export async function getTopChartTracks(genre: GenreOption): Promise<Track[]> {
  if (genre === 'Hits') {
    const arrays = await Promise.all(TOP_CHART_PLAYLISTS.map(id => getPlaylistTracks(id)));
    return dedupe(arrays.flat());
  }
  try {
    const category = GENRE_TO_CATEGORY[genre] ?? 'toplists';
    const result = await sdk().browse.getPlaylistsForCategory(category, 'US', 5);
    const playlists: SimplifiedPlaylist[] = result.playlists.items;
    const arrays = await Promise.all(playlists.map(p => getPlaylistTracks(p.id, 50)));
    return dedupe(arrays.flat());
  } catch { return []; }
}

export async function searchTracks(genre: GenreOption, decade?: string, limit = 50): Promise<Track[]> {
  const genreName = genre === 'Decades' ? 'pop' : genre.toLowerCase();
  let q = `genre:"${genreName}"`;
  if (decade && DECADE_YEAR_FILTER[decade]) q += ` ${DECADE_YEAR_FILTER[decade]}`;
  try {
    const result = await sdk().search(q, ['track'], 'US', limit as unknown as 1);
    return (result.tracks?.items ?? []) as Track[];
  } catch { return []; }
}

export async function getAudioFeatures(ids: string[]): Promise<AudioFeatures[]> {
  if (ids.length === 0) return [];
  const results: AudioFeatures[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100);
    try {
      const data = await sdk().tracks.audioFeatures(batch as [string]);
      if (Array.isArray(data)) {
        results.push(...data.filter((f): f is AudioFeatures => f !== null));
      }
    } catch { break; }
  }
  return results;
}

export async function getCurrentUser() {
  return sdk().currentUser.profile();
}

export async function createPlaylist(userId: string, name: string, description: string) {
  return sdk().playlists.createPlaylist(userId, { name, description, public: false });
}

export async function addTracksToPlaylist(playlistId: string, uris: string[]): Promise<void> {
  for (let i = 0; i < uris.length; i += 100) {
    await sdk().playlists.addItemsToPlaylist(playlistId, uris.slice(i, i + 100));
  }
}
