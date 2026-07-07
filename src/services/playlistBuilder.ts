import type {
  PlaylistConfig,
  GeneratedPlaylist,
  Segment,
  Track,
  SegmentType,
  BPMRange,
} from '../types';
import * as spotify from './spotify';
import type { Track as SpotifySDKTrack, AudioFeatures } from './spotify';
import * as appleMusic from './appleMusic';
import * as deezer from './deezer';

// ─── Spin class structure ─────────────────────────────────────────────────────

interface SegmentDef {
  type: SegmentType;
  count: number;
}

function getClassStructure(durationMinutes: number, coolDown: boolean): SegmentDef[] {
  const structures: Record<number, SegmentDef[]> = {
    30: [
      { type: 'warmup',   count: 1 },
      { type: 'flat',     count: 1 },
      { type: 'climb',    count: 1 },
      { type: 'sprint',   count: 1 },
      { type: 'recovery', count: 1 },
      { type: 'climb',    count: 1 },
      { type: 'flat',     count: 1 },
      { type: 'jump',     count: 1 },
    ],
    45: [
      { type: 'warmup',   count: 2 },
      { type: 'flat',     count: 2 },
      { type: 'climb',    count: 2 },
      { type: 'sprint',   count: 2 },
      { type: 'recovery', count: 1 },
      { type: 'climb',    count: 1 },
      { type: 'flat',     count: 1 },
      { type: 'jump',     count: 2 },
    ],
    60: [
      { type: 'warmup',   count: 2 },
      { type: 'flat',     count: 2 },
      { type: 'climb',    count: 2 },
      { type: 'sprint',   count: 2 },
      { type: 'recovery', count: 2 },
      { type: 'climb',    count: 2 },
      { type: 'flat',     count: 2 },
      { type: 'jump',     count: 3 },
    ],
  };
  const base = structures[durationMinutes] ?? structures[45];
  if (coolDown) base.push({ type: 'cooldown', count: 2 });
  return base;
}

function segmentBpmRange(type: SegmentType, selected: number): BPMRange {
  switch (type) {
    case 'warmup':   return { min: Math.max(50, selected - 15), max: selected + 10 };
    case 'flat':     return { min: Math.max(60, selected - 5),  max: selected + 20 };
    case 'climb':    return { min: Math.max(45, selected - 40), max: Math.max(75, selected - 5) };
    case 'sprint':   return { min: Math.min(selected + 10, 100), max: Math.min(selected + 45, 145) };
    case 'recovery': return { min: Math.max(55, selected - 25), max: selected + 5 };
    case 'jump':     return { min: Math.max(65, selected - 10), max: selected + 20 };
    case 'cooldown': return { min: Math.max(35, selected - 60), max: Math.max(65, selected - 20) };
    default:         return { min: selected - 15, max: selected + 15 };
  }
}

// ─── Track pool ───────────────────────────────────────────────────────────────

interface PoolTrack {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  artists: Array<{ name: string }>;
  album: { name: string; images: Array<{ url: string }> };
  preview_url?: string | null;
  popularity?: number;
  bpm: number;
  appearanceCount: number;
}

function inRange(bpm: number, range: BPMRange) {
  return bpm >= range.min && bpm <= range.max;
}

function pickTracks(pool: PoolTrack[], range: BPMRange, count: number, used: Set<string>): PoolTrack[] {
  let available = pool
    .filter(t => !used.has(t.id) && inRange(t.bpm, range))
    .sort((a, b) => b.appearanceCount - a.appearanceCount || (b.popularity ?? 0) - (a.popularity ?? 0));

  if (available.length < count) {
    available = pool
      .filter(t => !used.has(t.id) && inRange(t.bpm, { min: range.min - 15, max: range.max + 15 }))
      .sort((a, b) => b.appearanceCount - a.appearanceCount || (b.popularity ?? 0) - (a.popularity ?? 0));
  }

  if (available.length < count) {
    const mid = (range.min + range.max) / 2;
    available = [...pool]
      .filter(t => !used.has(t.id))
      .sort((a, b) => Math.abs(a.bpm - mid) - Math.abs(b.bpm - mid));
  }

  const selected = available.slice(0, count);
  selected.forEach(t => used.add(t.id));
  return selected;
}

function poolTrackToTrack(t: PoolTrack, type: SegmentType): Track {
  return {
    id: t.id,
    name: t.name,
    artist: t.artists.map(a => a.name).join(', '),
    album: t.album.name,
    durationMs: t.duration_ms,
    bpm: t.bpm,
    segmentType: type,
    imageUrl: t.album.images[1]?.url ?? t.album.images[0]?.url,
    previewUrl: t.preview_url ?? undefined,
    uri: t.uri,
    popularity: t.popularity,
    appearanceCount: t.appearanceCount,
  };
}

function sdkTrackToPool(t: SpotifySDKTrack, bpm: number, appearanceCount: number): PoolTrack {
  return {
    id: t.id,
    name: t.name,
    uri: t.uri,
    duration_ms: t.duration_ms,
    artists: t.artists,
    album: { name: t.album.name, images: t.album.images },
    preview_url: t.preview_url,
    popularity: t.popularity,
    bpm,
    appearanceCount,
  };
}

function assignHeuristicBpms(tracks: SpotifySDKTrack[], genre: string, countMap: Map<string, number>): PoolTrack[] {
  const profile = spotify.GENRE_BPM_PROFILE[genre] ?? { typical: 110, range: [80, 140] as [number, number] };
  const [lo, hi] = profile.range;
  const spread = hi - lo;
  return tracks.map((t, i) => {
    const bpm = Math.round(Math.max(lo, Math.min(hi, lo + spread * (0.5 + 0.4 * Math.sin(i * 1.3 + 1)))));
    return sdkTrackToPool(t, bpm, countMap.get(t.id) ?? 1);
  });
}

function adjustDuration(
  segments: Segment[],
  targetMs: number,
  pool: PoolTrack[],
  used: Set<string>,
): void {
  const tolerance = 2 * 60_000;
  const totalMs = () => segments.reduce((s, seg) => s + seg.tracks.reduce((ss, t) => ss + t.durationMs, 0), 0);
  const expandable: SegmentType[] = ['flat', 'jump', 'recovery'];

  while (totalMs() < targetMs - tolerance) {
    let added = false;
    for (const type of expandable) {
      const seg = segments.find(s => s.type === type);
      if (!seg) continue;
      const picked = pickTracks(pool, seg.bpmRange, 1, used);
      if (picked.length > 0) {
        seg.tracks.push(poolTrackToTrack(picked[0], type));
        added = true;
        if (totalMs() >= targetMs - tolerance) break;
      }
    }
    if (!added) break;
  }

  while (totalMs() > targetMs + tolerance) {
    let removed = false;
    for (const type of [...expandable].reverse()) {
      const seg = segments.find(s => s.type === type);
      if (seg && seg.tracks.length > 1) {
        seg.tracks.pop();
        removed = true;
        if (totalMs() <= targetMs + tolerance) break;
      }
    }
    if (!removed) break;
  }
}

// ─── Spotify playlist builder ─────────────────────────────────────────────────

export async function buildSpotifyPlaylist(
  config: PlaylistConfig,
  onProgress?: (msg: string) => void,
): Promise<GeneratedPlaylist> {
  const { bpm: selectedBpm, genre, decade, durationMinutes, coolDown } = config;

  onProgress?.('Scanning top charts…');
  const [chartTracks, searchedTracks] = await Promise.all([
    spotify.getTopChartTracks(genre),
    spotify.searchTracks(genre, decade),
  ]);

  const countMap = new Map<string, number>();
  const countAll = (arr: SpotifySDKTrack[]) =>
    arr.forEach(t => countMap.set(t.id, (countMap.get(t.id) ?? 0) + 1));
  countAll(chartTracks);
  countAll(searchedTracks);

  const allMap = new Map<string, SpotifySDKTrack>();
  [...chartTracks, ...searchedTracks].forEach(t => { if (!allMap.has(t.id)) allMap.set(t.id, t); });
  const allTracks = Array.from(allMap.values());

  onProgress?.('Analyzing BPMs…');
  const features = await spotify.getAudioFeatures(allTracks.map(t => t.id));

  let pool: PoolTrack[];
  if (features.length > 0) {
    const featMap = new Map<string, AudioFeatures>(features.map(f => [f.id, f]));
    pool = allTracks
      .filter(t => featMap.has(t.id))
      .map(t => sdkTrackToPool(t, Math.round(featMap.get(t.id)!.tempo), countMap.get(t.id) ?? 1));
  } else {
    onProgress?.('Using genre BPM profile…');
    pool = assignHeuristicBpms(allTracks, genre, countMap);
  }

  onProgress?.('Building spin class structure…');
  const structure = getClassStructure(durationMinutes, coolDown);
  const used = new Set<string>();
  const segments: Segment[] = [];

  for (const { type, count } of structure) {
    const bpmRange = segmentBpmRange(type, selectedBpm);
    const picked = pickTracks(pool, bpmRange, count, used);
    segments.push({ type, bpmRange, tracks: picked.map(t => poolTrackToTrack(t, type)) });
  }

  onProgress?.('Fine-tuning playlist length…');
  adjustDuration(segments, durationMinutes * 60_000, pool, used);

  return {
    segments,
    totalDurationMs: segments.reduce((s, seg) => s + seg.tracks.reduce((ss, t) => ss + t.durationMs, 0), 0),
    config,
  };
}

// ─── Deezer playlist builder (free, no account needed) ───────────────────────

export async function buildDeezerPlaylist(
  config: PlaylistConfig,
  onProgress?: (msg: string) => void,
): Promise<GeneratedPlaylist> {
  const { bpm: selectedBpm, genre, decade, durationMinutes, coolDown } = config;

  onProgress?.('Fetching tracks from Deezer…');
  const tracks = await deezer.fetchTracks(genre, decade);

  if (tracks.length === 0) {
    throw new Error(
      'Could not fetch any tracks from Deezer. Check your internet connection — the dev server proxies requests to api.deezer.com.',
    );
  }

  const pool: PoolTrack[] = tracks.map(t => ({
    id: t.id,
    name: t.name,
    uri: `deezer:track:${t.id}`,
    duration_ms: t.durationMs,
    artists: [{ name: t.artist }],
    album: { name: t.album, images: t.imageUrl ? [{ url: t.imageUrl }] : [] },
    preview_url: t.previewUrl ?? null,
    popularity: t.popularity,
    bpm: t.bpm,
    appearanceCount: 1,
  }));

  onProgress?.('Building spin class structure…');
  const structure = getClassStructure(durationMinutes, coolDown);
  const used = new Set<string>();
  const segments: Segment[] = [];

  for (const { type, count } of structure) {
    const bpmRange = segmentBpmRange(type, selectedBpm);
    const picked = pickTracks(pool, bpmRange, count, used);
    segments.push({ type, bpmRange, tracks: picked.map(t => poolTrackToTrack(t, type)) });
  }

  onProgress?.('Fine-tuning playlist length…');
  adjustDuration(segments, durationMinutes * 60_000, pool, used);

  return {
    segments,
    totalDurationMs: segments.reduce((s, seg) => s + seg.tracks.reduce((ss, t) => ss + t.durationMs, 0), 0),
    config,
  };
}

// ─── Apple Music playlist builder ─────────────────────────────────────────────

export async function buildAppleMusicPlaylist(
  config: PlaylistConfig,
  onProgress?: (msg: string) => void,
): Promise<GeneratedPlaylist> {
  const { bpm: selectedBpm, genre, decade, durationMinutes, coolDown } = config;

  onProgress?.('Scanning Apple Music charts…');
  const [chartTracks, searchedTracks] = await Promise.all([
    appleMusic.getChartTracks(100),
    appleMusic.searchTracks(`${genre}${decade ? ' ' + decade : ''} music`, 50),
  ]);

  const allMap = new Map<string, appleMusic.AppleTrackRaw>();
  [...chartTracks, ...searchedTracks].forEach(t => { if (!allMap.has(t.id)) allMap.set(t.id, t); });

  const profile = spotify.GENRE_BPM_PROFILE[genre] ?? { typical: 110, range: [80, 140] as [number, number] };
  const [lo, hi] = profile.range;
  const spread = hi - lo;

  const pool: PoolTrack[] = Array.from(allMap.values()).map((t, i) => ({
    id: t.id,
    name: t.name,
    uri: t.uri,
    duration_ms: t.durationMs,
    artists: [{ name: t.artist }],
    album: { name: t.album, images: t.imageUrl ? [{ url: t.imageUrl }] : [] },
    preview_url: t.previewUrl,
    popularity: t.popularity,
    bpm: t.bpmEstimate ? Math.round(t.bpmEstimate)
      : Math.round(lo + spread * (0.5 + 0.4 * Math.sin(i * 1.3 + 1))),
    appearanceCount: chartTracks.find(c => c.id === t.id) ? 2 : 1,
  }));

  onProgress?.('Building spin class structure…');
  const structure = getClassStructure(durationMinutes, coolDown);
  const used = new Set<string>();
  const segments: Segment[] = [];

  for (const { type, count } of structure) {
    const bpmRange = segmentBpmRange(type, selectedBpm);
    const picked = pickTracks(pool, bpmRange, count, used);
    segments.push({ type, bpmRange, tracks: picked.map(t => poolTrackToTrack(t, type)) });
  }

  adjustDuration(segments, durationMinutes * 60_000, pool, used);

  return {
    segments,
    totalDurationMs: segments.reduce((s, seg) => s + seg.tracks.reduce((ss, t) => ss + t.durationMs, 0), 0),
    config,
  };
}
