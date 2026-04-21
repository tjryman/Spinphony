import type { SegmentType } from '../types';
import { SEGMENT_LABELS, SEGMENT_COLORS, SEGMENT_ICONS } from '../utils/format';

interface Props {
  type: SegmentType;
  trackCount: number;
  totalMs: number;
}

export default function SegmentLabel({ type, trackCount, totalMs }: Props) {
  const colors = SEGMENT_COLORS[type] ?? SEGMENT_COLORS['flat'];
  const label = SEGMENT_LABELS[type] ?? type;
  const icon = SEGMENT_ICONS[type] ?? '🎵';
  const minutes = Math.round(totalMs / 60_000);

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border w-fit ${colors.bg} ${colors.border}`}>
      <span className="text-sm">{icon}</span>
      <span className={`text-xs font-semibold uppercase tracking-wider ${colors.text}`}>{label}</span>
      <span className="text-xs text-gray-500">
        {trackCount} {trackCount === 1 ? 'track' : 'tracks'} · ~{minutes}m
      </span>
    </div>
  );
}
