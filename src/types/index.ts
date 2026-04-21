export type BPMOption = 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100 | 110 | 120;

export type GenreOption =
  | 'Pop'
  | 'Hip-Hop'
  | 'Country'
  | 'Funk'
  | 'Dance'
  | 'Hits'
  | 'Rock'
  | 'Metal'
  | 'Indie'
  | 'K-Pop'
  | 'J-Pop'
  | 'Emo'
  | 'Gospel'
  | 'R&B'
  | 'Alternative'
  | 'Latin'
  | 'Punk'
  | 'Reggae'
  | 'Decades';

export type DecadeOption = '70s' | '80s' | '90s' | '2000s' | '2010s' | '2020s';

export type PlaylistLength = 30 | 45 | 60;

export type Platform = 'spotify' | 'apple-music';

export type SegmentType = 'warmup' | 'flat' | 'climb' | 'sprint' | 'recovery' | 'jump' | 'cooldown';

export interface PlaylistConfig {
  bpm: BPMOption;
  genre: GenreOption;
  decade?: DecadeOption;
  durationMinutes: PlaylistLength;
  coolDown: boolean;
  platform: Platform;
}

export interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  durationMs: number;
  bpm: number;
  segmentType: SegmentType;
  imageUrl?: string;
  previewUrl?: string;
  uri: string;
  popularity?: number;
  appearanceCount?: number;
}

export interface BPMRange {
  min: number;
  max: number;
}

export interface Segment {
  type: SegmentType;
  bpmRange: BPMRange;
  tracks: Track[];
}

export interface GeneratedPlaylist {
  segments: Segment[];
  totalDurationMs: number;
  config: PlaylistConfig;
}

export interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  preview_url?: string | null;
  popularity?: number;
}

export interface SpotifyAudioFeatures {
  id: string;
  tempo: number;
  energy: number;
  danceability: number;
  valence: number;
}

export interface SpotifyUser {
  id: string;
  display_name: string;
}
