// Apple MusicKit JS is loaded from CDN in index.html
// TypeScript types for the global MusicKit object

declare global {
  interface Window {
    MusicKit?: {
      configure: (config: {
        developerToken: string;
        app: { name: string; build: string };
      }) => MusicKitInstance;
      getInstance: () => MusicKitInstance;
    };
  }
}

interface MusicKitInstance {
  authorize: () => Promise<string>;
  unauthorize: () => Promise<void>;
  isAuthorized: boolean;
  musicUserToken: string;
  api: {
    search: (term: string, params: Record<string, unknown>) => Promise<AppleMusicSearchResult>;
    charts: (types: string[], params: Record<string, unknown>) => Promise<AppleMusicChartsResult>;
    library: {
      playlists: {
        create: (attributes: { name: string; description?: string }) => Promise<{ id: string }>;
        tracks: {
          add: (playlistId: string, trackIds: string[]) => Promise<void>;
        };
      };
    };
  };
}

interface AppleMusicSong {
  id: string;
  attributes: {
    name: string;
    artistName: string;
    albumName: string;
    durationInMillis: number;
    artwork?: { url: string; width: number; height: number };
    previews?: Array<{ url: string }>;
    genreNames?: string[];
    tempo?: number;
    url?: string;
  };
}

interface AppleMusicSearchResult {
  songs?: { data: AppleMusicSong[] };
}

interface AppleMusicChartsResult {
  songs?: Array<{ data: AppleMusicSong[] }>;
}

// ─── Configuration ────────────────────────────────────────────────────────────

const DEV_TOKEN = import.meta.env.VITE_APPLE_MUSIC_DEV_TOKEN as string | undefined;

export function isConfigured(): boolean {
  return Boolean(DEV_TOKEN) && Boolean(window.MusicKit);
}

export function configure(): void {
  if (!DEV_TOKEN || !window.MusicKit) return;
  window.MusicKit.configure({
    developerToken: DEV_TOKEN,
    app: { name: 'Spinphony', build: '1.0.0' },
  });
}

export async function authorize(): Promise<string> {
  configure();
  const music = window.MusicKit?.getInstance();
  if (!music) throw new Error('MusicKit not available');
  return music.authorize();
}

export function isAuthorized(): boolean {
  try {
    return window.MusicKit?.getInstance()?.isAuthorized ?? false;
  } catch { return false; }
}

export async function disconnect(): Promise<void> {
  try {
    await window.MusicKit?.getInstance()?.unauthorize();
  } catch { /* ignore */ }
}

// ─── Apple Music search result → internal Track shape ────────────────────────

export interface AppleTrackRaw {
  id: string;
  name: string;
  artist: string;
  album: string;
  durationMs: number;
  imageUrl?: string;
  previewUrl?: string;
  popularity: number;
  uri: string;
  bpmEstimate?: number;
}

function songToRaw(song: AppleMusicSong, index: number): AppleTrackRaw {
  const attr = song.attributes;
  const imgUrl = attr.artwork?.url
    ? attr.artwork.url.replace('{w}', '300').replace('{h}', '300')
    : undefined;
  return {
    id: song.id,
    name: attr.name,
    artist: attr.artistName,
    album: attr.albumName,
    durationMs: attr.durationInMillis,
    imageUrl: imgUrl,
    previewUrl: attr.previews?.[0]?.url,
    popularity: Math.max(0, 100 - index * 2),
    uri: `am:track:${song.id}`,
    bpmEstimate: attr.tempo,
  };
}

// ─── Data fetching ────────────────────────────────────────────────────────────

export async function searchTracks(term: string, limit = 50): Promise<AppleTrackRaw[]> {
  const music = window.MusicKit?.getInstance();
  if (!music) return [];
  try {
    const result = await music.api.search(term, {
      types: 'songs',
      limit,
      storefront: 'us',
    });
    return (result.songs?.data ?? []).map((s, i) => songToRaw(s, i));
  } catch { return []; }
}

export async function getChartTracks(limit = 100): Promise<AppleTrackRaw[]> {
  const music = window.MusicKit?.getInstance();
  if (!music) return [];
  try {
    const result = await music.api.charts(['songs'], {
      limit,
      storefront: 'us',
    });
    return (result.songs?.[0]?.data ?? []).map((s, i) => songToRaw(s, i));
  } catch { return []; }
}

export async function savePlaylist(
  name: string,
  trackIds: string[],
): Promise<void> {
  const music = window.MusicKit?.getInstance();
  if (!music) throw new Error('MusicKit not available');
  const playlist = await music.api.library.playlists.create({ name, description: 'Created by Spinphony' });
  await music.api.library.playlists.tracks.add(playlist.id, trackIds);
}

// ─── Export an externally-built playlist (e.g. Deezer/demo) ──────────────────
//
// Resolves each track to an Apple Music catalog song by searching name+artist,
// then creates a library playlist with the matched songs in the same order.
// Tracks that can't be confidently matched are skipped (never replaced with a
// wrong song) and reported back to the caller.

export interface ExportTrackInput {
  name: string;
  artist: string;
  durationMs: number;
}

export interface ExportResult {
  added: number;
  total: number;
  skipped: string[];
}

const API_BASE = 'https://api.music.apple.com/v1';

function apiHeaders(userToken?: string): Record<string, string> {
  const h: Record<string, string> = { Authorization: `Bearer ${DEV_TOKEN}` };
  if (userToken) {
    h['Music-User-Token'] = userToken;
    h['Content-Type'] = 'application/json';
  }
  return h;
}

// Normalize for fuzzy comparison: strip parentheticals, feat. credits, punctuation
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\(.*?\)|\[.*?\]/g, ' ')
    .replace(/\b(feat|ft|featuring|with)\.?\b.*$/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function artistsOverlap(a: string, b: string): boolean {
  const tokens = (s: string) => new Set(norm(s).split(' ').filter(t => t.length > 2));
  const ta = tokens(a);
  const tb = tokens(b);
  for (const t of ta) if (tb.has(t)) return true;
  return false;
}

function titleMatches(a: string, b: string): boolean {
  const na = norm(a);
  const nb = norm(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

async function findCatalogSongId(track: ExportTrackInput): Promise<string | null> {
  const term = encodeURIComponent(`${track.name} ${track.artist}`);
  const resp = await fetch(
    `${API_BASE}/catalog/us/search?term=${term}&types=songs&limit=10`,
    { headers: apiHeaders() },
  );
  if (!resp.ok) throw new Error(`Apple Music search failed (${resp.status})`);
  const json = (await resp.json()) as { results?: AppleMusicSearchResult };
  const candidates = json.results?.songs?.data ?? [];

  let best: AppleMusicSong | null = null;
  let bestScore = 0;
  for (const song of candidates) {
    const attr = song.attributes;
    if (!titleMatches(attr.name, track.name)) continue;
    if (!artistsOverlap(attr.artistName, track.artist)) continue;
    let score = 1;
    if (norm(attr.name) === norm(track.name)) score += 2;
    if (Math.abs(attr.durationInMillis - track.durationMs) < 8000) score += 1;
    if (score > bestScore) {
      bestScore = score;
      best = song;
    }
  }
  return best?.id ?? null;
}

export async function exportPlaylist(
  name: string,
  description: string,
  tracks: ExportTrackInput[],
  onProgress?: (msg: string) => void,
): Promise<ExportResult> {
  if (!DEV_TOKEN || DEV_TOKEN === 'your_apple_music_developer_token_here') {
    throw new Error(
      'Apple Music export needs a developer token — set VITE_APPLE_MUSIC_DEV_TOKEN in your .env file (see .env.example).',
    );
  }
  if (!window.MusicKit) throw new Error('MusicKit failed to load — check your internet connection.');

  // Sign the user in (no-op if already authorized)
  configure();
  const music = window.MusicKit.getInstance();
  if (!music.isAuthorized) {
    onProgress?.('Waiting for Apple Music sign-in…');
    await music.authorize();
  }

  // Match tracks in order, small batches to stay under rate limits
  const ids: (string | null)[] = new Array(tracks.length).fill(null);
  const BATCH = 5;
  for (let i = 0; i < tracks.length; i += BATCH) {
    onProgress?.(`Matching songs ${Math.min(i + BATCH, tracks.length)}/${tracks.length}…`);
    const batch = tracks.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(t => findCatalogSongId(t).catch(() => null)));
    results.forEach((id, j) => { ids[i + j] = id; });
  }

  const matched = ids
    .map((id, i) => ({ id, track: tracks[i] }))
    .filter((x): x is { id: string; track: ExportTrackInput } => x.id !== null);
  const skipped = ids
    .map((id, i) => (id === null ? `${tracks[i].name} — ${tracks[i].artist}` : null))
    .filter((s): s is string => s !== null);

  if (matched.length === 0) {
    throw new Error('None of the tracks could be found on Apple Music.');
  }

  // Create the playlist with tracks inline — the API preserves array order
  onProgress?.('Creating playlist in your library…');
  const resp = await fetch(`${API_BASE}/me/library/playlists`, {
    method: 'POST',
    headers: apiHeaders(music.musicUserToken),
    body: JSON.stringify({
      attributes: { name, description },
      relationships: {
        tracks: { data: matched.map(m => ({ id: m.id, type: 'songs' })) },
      },
    }),
  });
  if (!resp.ok) throw new Error(`Could not create the playlist (${resp.status})`);

  return { added: matched.length, total: tracks.length, skipped };
}
