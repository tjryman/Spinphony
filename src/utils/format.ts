export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatTotalDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatBpm(bpm: number): string {
  return `${Math.round(bpm)} BPM`;
}

export const SEGMENT_LABELS: Record<string, string> = {
  warmup: 'Warm Up',
  flat: 'Flat Road',
  climb: 'Heavy Climb',
  sprint: 'Sprint',
  recovery: 'Recovery Jog',
  jump: 'Jump Track',
  cooldown: 'Cool Down',
};

export const SEGMENT_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  warmup:   { bg: 'bg-amber-500/10',  text: 'text-amber-400',  border: 'border-amber-500/30',  dot: 'bg-amber-400' },
  flat:     { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/30',   dot: 'bg-blue-400' },
  climb:    { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', dot: 'bg-orange-400' },
  sprint:   { bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/30',    dot: 'bg-red-400' },
  recovery: { bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/30',  dot: 'bg-green-400' },
  jump:     { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', dot: 'bg-yellow-400' },
  cooldown: { bg: 'bg-cyan-500/10',   text: 'text-cyan-400',   border: 'border-cyan-500/30',   dot: 'bg-cyan-400' },
};

export const SEGMENT_ICONS: Record<string, string> = {
  warmup: '🔥',
  flat: '🛣️',
  climb: '⛰️',
  sprint: '⚡',
  recovery: '💚',
  jump: '🎵',
  cooldown: '❄️',
};
