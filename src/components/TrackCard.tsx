import { Music, BarChart2, Star } from 'lucide-react';
import type { Track } from '../types';
import { formatDuration, formatBpm, SEGMENT_COLORS } from '../utils/format';

interface Props {
  track: Track;
  index: number;
}

export default function TrackCard({ track, index }: Props) {
  const colors = SEGMENT_COLORS[track.segmentType] ?? SEGMENT_COLORS['flat'];
  const isPopular = (track.appearanceCount ?? 0) > 1;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-spin-card border border-spin-border hover:border-spin-accent/30 transition-all group">
      {/* Track number */}
      <span className="text-xs text-gray-600 w-5 text-right shrink-0 font-mono">{index + 1}</span>

      {/* Album art */}
      <div className="w-10 h-10 rounded-lg shrink-0 overflow-hidden bg-spin-border flex items-center justify-center">
        {track.imageUrl ? (
          <img src={track.imageUrl} alt={track.album} className="w-full h-full object-cover" />
        ) : (
          <Music size={16} className="text-gray-600" />
        )}
      </div>

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-white truncate">{track.name}</p>
          {isPopular && (
            <span title="Appears in multiple charts">
              <Star size={10} className="text-yellow-400 shrink-0 fill-yellow-400" />
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">{track.artist}</p>
      </div>

      {/* BPM badge — "~" marks a genre-based estimate rather than measured data */}
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-mono shrink-0 ${colors.bg} ${colors.text} ${colors.border}`}
        title={track.bpmIsReal === false ? 'Estimated BPM (no measured tempo available)' : 'Measured BPM'}
      >
        <BarChart2 size={10} />
        {formatBpm(track.bpm, track.bpmIsReal !== false)}
      </div>

      {/* Duration */}
      <span className="text-xs text-gray-500 font-mono shrink-0 w-10 text-right">
        {formatDuration(track.durationMs)}
      </span>
    </div>
  );
}
