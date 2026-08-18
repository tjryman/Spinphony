import type { GenreOption } from '../types';
import { GENRE_BPM_PROFILE } from './spotify';
import { fetchDemoTracks } from './demoLibrary';

// ─── Genre config ─────────────────────────────────────────────────────────────

// Deezer genre IDs for chart endpoint (0 = global top)
const GENRE_CHART_ID: Partial<Record<GenreOption, number>> = {
  'Pop':     132,
  'Hip-Hop': 116,
  'Rock':    152,
  'Dance':   106,
  'R&B':     165,
  'Latin':   67,
  'Reggae':  144,
  'Hits':    0,
};

const GENRE_QUERY: Record<string, string> = {
  'Pop':         'pop',
  'Hip-Hop':     'hip hop rap',
  'Country':     'country',
  'Funk':        'funk soul',
  'Dance':       'dance electronic',
  'Hits':        'top hits',
  'Rock':        'rock',
  'Metal':       'metal heavy metal',
  'Indie':       'indie alternative',
  'K-Pop':       'k-pop kpop',
  'J-Pop':       'j-pop jpop',
  'Emo':         'emo punk',
  'Gospel':      'gospel christian',
  'R&B':         'r&b soul',
  'Alternative': 'alternative indie rock',
  'Latin':       'latin reggaeton',
  'Punk':        'punk rock',
  'Reggae':      'reggae',
  'Decades':     'classic hits',
};

const DECADE_TERM: Record<string, string> = {
  '70s': '1970s',
  '80s': '1980s',
  '90s': '1990s',
  '2000s': '2000s',
  '2010s': '2010s',
  '2020s': '2020s',
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DeezerTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  durationMs: number;
  bpm: number;
  bpmIsReal: boolean;
  imageUrl?: string;
  previewUrl?: string;
  popularity: number;
  demo?: boolean;
}

interface DeezerSearchItem {
  id: number;
  title: string;
  duration: number;
  rank: number;
  preview: string;
  artist: { name: string };
  album: { title: string; cover_medium: string };
}

interface DeezerTrackDetail {
  id: number;
  bpm: number;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function deezerGet(path: string): Promise<unknown> {
  const resp = await fetch(`/api/deezer${path}`);
  if (!resp.ok) throw new Error(`Deezer ${resp.status}`);
  return resp.json();
}

async function fetchBpm(id: number): Promise<number> {
  try {
    const d = (await deezerGet(`/track/${id}`)) as DeezerTrackDetail;
    return d.bpm ?? 0;
  } catch {
    return 0;
  }
}

function heuristicBpm(genre: GenreOption, idx: number): number {
  const p = GENRE_BPM_PROFILE[genre] ?? { typical: 110, range: [80, 140] as [number, number] };
  const [lo, hi] = p.range;
  return Math.round(lo + (hi - lo) * (0.5 + 0.4 * Math.sin(idx * 1.3 + 1)));
}

function toTracks(items: DeezerSearchItem[], bpms: number[], genre: GenreOption): DeezerTrack[] {
  return items.map((t, i) => {
    const real = bpms[i] > 0 ? bpms[i] : 0;
    return {
      id: String(t.id),
      name: t.title,
      artist: t.artist.name,
      album: t.album.title,
      durationMs: t.duration * 1000,
      bpm: real > 0 ? real : heuristicBpm(genre, i),
      bpmIsReal: real > 0,
      imageUrl: t.album.cover_medium || undefined,
      previewUrl: t.preview || undefined,
      popularity: t.rank,
    };
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchTracks(genre: GenreOption, decade?: string): Promise<DeezerTrack[]> {
  const items: DeezerSearchItem[] = [];

  // Fetch chart tracks for genres with known IDs
  const chartId = GENRE_CHART_ID[genre];
  if (chartId !== undefined) {
    try {
      const d = (await deezerGet(`/chart/${chartId}/tracks?limit=25`)) as { data?: DeezerSearchItem[] };
      items.push(...(d.data ?? []));
    } catch { /* ignore */ }
  }

  // Keyword search
  let q = GENRE_QUERY[genre] ?? genre.toLowerCase();
  if (genre === 'Decades' && decade) q += ' ' + (DECADE_TERM[decade] ?? decade);

  try {
    const d = (await deezerGet(`/search?q=${encodeURIComponent(q)}&limit=25&order=RANKING`)) as { data?: DeezerSearchItem[] };
    items.push(...(d.data ?? []));
  } catch { /* ignore */ }

  // Deduplicate by id
  const seen = new Set<number>();
  const unique = items.filter(t => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });

  // Deezer unreachable (offline, blocked egress, etc.) — fall back to the
  // built-in demo library so the app stays fully testable.
  if (unique.length === 0) return fetchDemoTracks(genre, decade);

  // Parallel BPM lookup — Deezer's /track/{id} endpoint includes real BPM data
  const bpms = await Promise.all(unique.map(t => fetchBpm(t.id)));

  return toTracks(unique, bpms, genre);
}
