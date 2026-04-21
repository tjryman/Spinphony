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
