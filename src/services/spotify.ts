import type { SpotifyTokens, SpotifyTrack, SpotifyAudioFeatures, SpotifyUser, GenreOption } from '../types';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined ?? '2a82a87ad0d74e61b4fc554ddabbfae6';
export const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string | undefined ?? 'https://localhost:5173/';

const SCOPES = [
  'playlist-modify-public',
  'playlist-modify-private',
  'user-read-private',
  'user-read-email',
].join(' ');

// ─── PKCE helpers ────────────────────────────────────────────────────────────

function generateVerifier(length = 128): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .substring(0, length);
}

async function generateChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function isConfigured(): boolean {
  return Boolean(CLIENT_ID);
}

export async function initiateAuth(): Promise<void> {
  if (!CLIENT_ID) throw new Error('VITE_SPOTIFY_CLIENT_ID is not set');
  const verifier = generateVerifier();
  const challenge = await generateChallenge(verifier);
  sessionStorage.setItem('spotify_verifier', verifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  });
  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

export async function exchangeCode(code: string): Promise<SpotifyTokens> {
  const verifier = sessionStorage.getItem('spotify_verifier');
  if (!verifier) throw new Error('No PKCE verifier in session');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID!,
      code_verifier: verifier,
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);

  const json = await res.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  const tokens: SpotifyTokens = {
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    expires_at: Date.now() + json.expires_in * 1000,
  };
  localStorage.setItem('spotify_tokens', JSON.stringify(tokens));
  sessionStorage.removeItem('spotify_verifier');
  return tokens;
}

export function getStoredTokens(): SpotifyTokens | null {
  const raw = localStorage.getItem('spotify_tokens');
  return raw ? (JSON.parse(raw) as SpotifyTokens) : null;
}

export async function getValidToken(): Promise<string | null> {
  const tokens = getStoredTokens();
  if (!tokens) return null;
  if (Date.now() < tokens.expires_at - 60_000) return tokens.access_token;

  // Attempt refresh
  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token,
        client_id: CLIENT_ID!,
      }),
    });
    if (!res.ok) { localStorage.removeItem('spotify_tokens'); return null; }
    const json = await res.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };
    const fresh: SpotifyTokens = {
      access_token: json.access_token,
      refresh_token: json.refresh_token ?? tokens.refresh_token,
      expires_at: Date.now() + json.expires_in * 1000,
    };
    localStorage.setItem('spotify_tokens', JSON.stringify(fresh));
    return fresh.access_token;
  } catch {
    localStorage.removeItem('spotify_tokens');
    return null;
  }
}

export function disconnect(): void {
  localStorage.removeItem('spotify_tokens');
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Spotify ${res.status}: ${text.slice(0, 120)}`);
  }
  return res.json() as Promise<T>;
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

// Typical BPM profiles used for heuristic assignment when audio-features unavailable
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

// Global & US Top 50 playlist IDs
const TOP_CHART_PLAYLISTS = ['37i9dQZEVXbMDoHDwVN2tF', '37i9dQZEVXbLp5XoPON0wI'];

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getPlaylistTracks(token: string, playlistId: string, limit = 100): Promise<SpotifyTrack[]> {
  try {
    const data = await apiFetch<{ items: Array<{ track: SpotifyTrack | null }> }>(
      `/playlists/${playlistId}/tracks?limit=${limit}&market=US`,
      token,
    );
    return (data.items ?? []).flatMap(item => (item.track ? [item.track] : []));
  } catch { return []; }
}

function dedupe(tracks: SpotifyTrack[]): SpotifyTrack[] {
  const seen = new Set<string>();
  return tracks.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true; });
}

export async function getTopChartTracks(token: string, genre: GenreOption): Promise<SpotifyTrack[]> {
  if (genre === 'Hits') {
    const arrays = await Promise.all(TOP_CHART_PLAYLISTS.map(id => getPlaylistTracks(token, id)));
    return dedupe(arrays.flat());
  }
  try {
    const category = GENRE_TO_CATEGORY[genre] ?? 'toplists';
    const data = await apiFetch<{ playlists: { items: Array<{ id: string }> } }>(
      `/browse/categories/${category}/playlists?limit=5&country=US`,
      token,
    );
    const ids = (data.playlists?.items ?? []).map(p => p.id);
    const arrays = await Promise.all(ids.map(id => getPlaylistTracks(token, id, 50)));
    return dedupe(arrays.flat());
  } catch { return []; }
}

export async function searchTracks(
  token: string,
  genre: GenreOption,
  decade?: string,
  limit = 50,
): Promise<SpotifyTrack[]> {
  const genreName = genre === 'Decades' ? 'pop' : genre.toLowerCase();
  let q = `genre:"${genreName}"`;
  if (decade && DECADE_YEAR_FILTER[decade]) q += ` ${DECADE_YEAR_FILTER[decade]}`;

  try {
    const data = await apiFetch<{ tracks: { items: SpotifyTrack[] } }>(
      `/search?q=${encodeURIComponent(q)}&type=track&market=US&limit=${limit}`,
      token,
    );
    return data.tracks?.items ?? [];
  } catch { return []; }
}

export async function getAudioFeatures(
  token: string,
  ids: string[],
): Promise<SpotifyAudioFeatures[]> {
  if (ids.length === 0) return [];
  const results: SpotifyAudioFeatures[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100);
    try {
      const data = await apiFetch<{ audio_features: Array<SpotifyAudioFeatures | null> }>(
        `/audio-features?ids=${batch.join(',')}`,
        token,
      );
      results.push(...(data.audio_features?.filter((f): f is SpotifyAudioFeatures => f !== null) ?? []));
    } catch {
      // endpoint may be unavailable for this app — caller handles the empty result
      break;
    }
  }
  return results;
}

// ─── User & playlist management ───────────────────────────────────────────────

export async function getCurrentUser(token: string): Promise<SpotifyUser> {
  return apiFetch<SpotifyUser>('/me', token);
}

export async function createPlaylist(
  token: string,
  userId: string,
  name: string,
  description: string,
): Promise<{ id: string }> {
  const res = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, public: false }),
  });
  if (!res.ok) throw new Error(`Create playlist failed: ${res.status}`);
  return res.json() as Promise<{ id: string }>;
}

export async function addTracksToPlaylist(
  token: string,
  playlistId: string,
  uris: string[],
): Promise<void> {
  for (let i = 0; i < uris.length; i += 100) {
    const batch = uris.slice(i, i + 100);
    await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris: batch }),
    });
  }
}
