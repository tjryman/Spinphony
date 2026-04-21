import type {
  PlaylistConfig,
  GeneratedPlaylist,
  Segment,
  Track,
  SegmentType,
  BPMRange,
  SpotifyTrack,
  SpotifyAudioFeatures,
} from '../types';
import * as spotify from './spotify';
import * as appleMusic from './appleMusic';

// ─── Spin class structure ─────────────────────────────────────────────────────

interface SegmentDef {
  type: SegmentType;
  count: number; // number of tracks for this segment
}

/**
 * Returns the ordered list of segment types and track counts for a class.
 * Mirrors the studio template: Warm Up → Flat → Climb → Sprint → Jog → Climb → Flat → Jump
 */
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

/**
 * Derives BPM target ranges for each segment type from the user-selected BPM.
 *
 * Spin guidelines:
 *   Climbs      60–75 BPM
 *   Endurance   80–95 BPM
 *   Sprints     100–120 BPM
 *
 * We anchor these ranges relative to the selected BPM so they scale naturally.
 */
function segmentBpmRange(type: SegmentType, selected: number): BPMRange {
  switch (type) {
    case 'warmup':
      return { min: Math.max(50, selected - 15), max: selected + 10 };
    case 'flat':
      return { min: Math.max(60, selected - 5),  max: selected + 20 };
    case 'climb':
      return { min: Math.max(45, selected - 40), max: Math.max(75, selected - 5) };
    case 'sprint':
      return { min: Math.min(selected + 10, 100), max: Math.min(selected + 45, 145) };
    case 'recovery':
      return { min: Math.max(55, selected - 25), max: selected + 5 };
    case 'jump':
      return { min: Math.max(65, selected - 10), max: selected + 20 };
    case 'cooldown':
      return { min: Math.max(35, selected - 60), max: Math.max(65, selected - 20) };
    default:
      return { min: selected - 15, max: selected + 15 };
  }
}

// ─── Track pool construction ──────────────────────────────────────────────────

interface PoolTrack extends SpotifyTrack {
  bpm: number;          // actual or heuristic
  appearanceCount: number;
}

function inRange(bpm: number, range: BPMRange): boolean {
  return bpm >= range.min && bpm <= range.max;
}

function closestToMid(tracks: PoolTrack[], range: BPMRange): PoolTrack[] {
  const mid = (range.min + range.max) / 2;
  return [...tracks].sort((a, b) => Math.abs(a.bpm - mid) - Math.abs(b.bpm - mid));
}

/**
 * Heuristic: distribute a list of tracks across the genre's BPM range
 * based on position in the list (earlier = more popular = higher chart rank).
 * Popularity rank acts as a proxy for energy when audio features are unavailable.
 */
function assignHeuristicBpms(
  tracks: SpotifyTrack[],
  genre: string,
): PoolTrack[] {
  const profile = spotify.GENRE_BPM_PROFILE[genre] ?? { typical: 110, range: [80, 140] as [number, number] };
  const [lo, hi] = profile.range;
  const spread = hi - lo;

  return tracks.map((t, i) => {
    // Distribute BPMs: high-popularity (top of chart) ≈ profile.typical ± small delta
    // lower popularity ≈ spread across the range
    const fraction = i / Math.max(tracks.length - 1, 1);
    // oscillate around typical to simulate variety
    const bpm = lo + spread * (0.5 + 0.4 * Math.sin(i * 1.3 + 1));
    return { ...t, bpm: Math.round(Math.max(lo, Math.min(hi, bpm + (fraction - 0.5) * spread * 0.3))), appearanceCount: 1 };
  });
}

function pickTracks(
  pool: PoolTrack[],
  range: BPMRange,
  count: number,
  used: Set<string>,
): PoolTrack[] {
  // Prefer in-range, sorted by (appearanceCount DESC, popularity DESC)
  let available = pool
    .filter(t => !used.has(t.id) && inRange(t.bpm, range))
    .sort((a, b) => b.appearanceCount - a.appearanceCount || (b.popularity ?? 0) - (a.popularity ?? 0));

  // Expand range if not enough
  if (available.length < count) {
    const wider = { min: range.min - 15, max: range.max + 15 };
    available = pool
      .filter(t => !used.has(t.id) && inRange(t.bpm, wider))
      .sort((a, b) => b.appearanceCount - a.appearanceCount || (b.popularity ?? 0) - (a.popularity ?? 0));
  }

  // Final fallback: closest BPM match regardless of range
  if (available.length < count) {
    available = closestToMid(
      pool.filter(t => !used.has(t.id)),
      range,
    );
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

// ─── Duration adjustment ──────────────────────────────────────────────────────

const AVG_SONG_MS = 3.5 * 60_000;

/**
 * After initial assembly, try to bring total within ±2 min of the target by
 * adding/removing songs from the most flexible segments (flat, jump, recovery).
 */
function adjustDuration(
  segments: Segment[],
  targetMs: number,
  pool: PoolTrack[],
  used: Set<string>,
  selectedBpm: number,
): void {
  const tolerance = 2 * 60_000;
  const totalMs = () => segments.reduce((s, seg) => s + seg.tracks.reduce((ss, t) => ss + t.durationMs, 0), 0);

  const expandable: SegmentType[] = ['flat', 'jump', 'recovery'];

  // Add tracks if too short
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
    if (!added) break; // no more tracks to add
  }

  // Remove tracks if too long (don't leave a segment empty)
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

  void selectedBpm; // kept for possible future use
}

// ─── Spotify playlist builder ─────────────────────────────────────────────────

export async function buildSpotifyPlaylist(
  config: PlaylistConfig,
  token: string,
  onProgress?: (msg: string) => void,
): Promise<GeneratedPlaylist> {
  const { bpm: selectedBpm, genre, decade, durationMinutes, coolDown } = config;

  onProgress?.('Scanning top charts…');
  const [chartTracks, searchedTracks] = await Promise.all([
    spotify.getTopChartTracks(token, genre),
    spotify.searchTracks(token, genre, decade),
  ]);

  // Count appearances for chart priority
  const countMap = new Map<string, number>();
  const countAll = (arr: SpotifyTrack[]) => arr.forEach(t => countMap.set(t.id, (countMap.get(t.id) ?? 0) + 1));
  countAll(chartTracks);
  countAll(searchedTracks);

  // Deduplicate
  const allMap = new Map<string, SpotifyTrack>();
  [...chartTracks, ...searchedTracks].forEach(t => { if (!allMap.has(t.id)) allMap.set(t.id, t); });
  const allTracks = Array.from(allMap.values());

  onProgress?.('Analyzing BPMs…');
  let poolTracks: PoolTrack[];

  const features = await spotify.getAudioFeatures(token, allTracks.map(t => t.id));

  if (features.length > 0) {
    // Audio features available — use real BPMs
    const featMap = new Map<string, SpotifyAudioFeatures>(features.map(f => [f.id, f]));
    poolTracks = allTracks
      .filter(t => featMap.has(t.id))
      .map(t => ({
        ...t,
        bpm: Math.round(featMap.get(t.id)!.tempo),
        appearanceCount: countMap.get(t.id) ?? 1,
      }));
  } else {
    // Fallback: heuristic BPM distribution
    onProgress?.('BPM analysis unavailable — using genre profile…');
    poolTracks = assignHeuristicBpms(allTracks, genre).map(t => ({
      ...t,
      appearanceCount: countMap.get(t.id) ?? 1,
    }));
  }

  onProgress?.('Building spin class structure…');
  const structure = getClassStructure(durationMinutes, coolDown);
  const used = new Set<string>();
  const segments: Segment[] = [];

  for (const { type, count } of structure) {
    const bpmRange = segmentBpmRange(type, selectedBpm);
    const picked = pickTracks(poolTracks, bpmRange, count, used);
    segments.push({
      type,
      bpmRange,
      tracks: picked.map(t => poolTrackToTrack(t, type)),
    });
  }

  onProgress?.('Fine-tuning playlist length…');
  adjustDuration(segments, durationMinutes * 60_000, poolTracks, used, selectedBpm);

  const totalDurationMs = segments.reduce(
    (sum, seg) => sum + seg.tracks.reduce((s, t) => s + t.durationMs, 0),
    0,
  );

  return { segments, totalDurationMs, config };
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

  // Deduplicate
  const allMap = new Map<string, appleMusic.AppleTrackRaw>();
  [...chartTracks, ...searchedTracks].forEach(t => { if (!allMap.has(t.id)) allMap.set(t.id, t); });

  const profile = spotify.GENRE_BPM_PROFILE[genre] ?? { typical: 110, range: [80, 140] as [number, number] };
  const [lo, hi] = profile.range;
  const spread = hi - lo;

  const poolTracks: PoolTrack[] = Array.from(allMap.values()).map((t, i) => {
    const bpm = t.bpmEstimate
      ? Math.round(t.bpmEstimate)
      : Math.round(lo + spread * (0.5 + 0.4 * Math.sin(i * 1.3 + 1)));
    return {
      id: t.id,
      name: t.name,
      uri: t.uri,
      duration_ms: t.durationMs,
      artists: [{ name: t.artist }],
      album: { name: t.album, images: t.imageUrl ? [{ url: t.imageUrl, width: 300, height: 300 }] : [] },
      preview_url: t.previewUrl,
      popularity: t.popularity,
      bpm,
      appearanceCount: chartTracks.find(c => c.id === t.id) ? 2 : 1,
    };
  });

  onProgress?.('Building spin class structure…');
  const structure = getClassStructure(durationMinutes, coolDown);
  const used = new Set<string>();
  const segments: Segment[] = [];

  for (const { type, count } of structure) {
    const bpmRange = segmentBpmRange(type, selectedBpm);
    const picked = pickTracks(poolTracks, bpmRange, count, used);
    segments.push({ type, bpmRange, tracks: picked.map(t => poolTrackToTrack(t, type)) });
  }

  adjustDuration(segments, durationMinutes * 60_000, poolTracks, used, selectedBpm);

  const totalDurationMs = segments.reduce(
    (sum, seg) => sum + seg.tracks.reduce((s, t) => s + t.durationMs, 0),
    0,
  );

  return { segments, totalDurationMs, config };
}
