import { useState } from 'react';
import { Save, CheckCircle, AlertCircle, Clock, Music2, RefreshCw, Copy, Check, Info } from 'lucide-react';
import type { GeneratedPlaylist } from '../types';
import TrackCard from './TrackCard';
import SegmentLabel from './SegmentLabel';
import { formatTotalDuration } from '../utils/format';
import * as spotifyService from '../services/spotify';
import * as appleMusicService from '../services/appleMusic';

interface Props {
  playlist: GeneratedPlaylist;
  onRegenerate: () => void;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function PlaylistDisplay({ playlist, onRegenerate }: Props) {
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState('');
  const [copied, setCopied] = useState(false);
  const [exportState, setExportState] = useState<SaveState>('idle');
  const [exportProgress, setExportProgress] = useState('');
  const [exportError, setExportError] = useState('');
  const [exportSummary, setExportSummary] = useState('');

  const { segments, totalDurationMs, config, note } = playlist;
  const allTracks = segments.flatMap(s => s.tracks);
  const trackCount = allTracks.length;
  const isSpotify = config.platform === 'spotify';
  const isDeezer = config.platform === 'deezer';

  const targetMin = config.durationMinutes;
  const actualMin = Math.round(totalDurationMs / 60_000);
  const diff = Math.abs(actualMin - targetMin);
  const withinTarget = diff <= 2;

  async function handleExportToAppleMusic() {
    setExportState('saving');
    setExportError('');
    setExportSummary('');

    const genreLabel = config.genre === 'Decades' && config.decade
      ? `${config.decade} ${config.genre}`
      : config.genre;
    const playlistName = `Spinphony · ${genreLabel} · ${config.bpm} BPM · ${config.durationMinutes}min`;
    const description = `Auto-generated spin class playlist by Spinphony. ${config.durationMinutes}-min ${genreLabel} class at ${config.bpm} BPM.`;

    try {
      const result = await appleMusicService.exportPlaylist(
        playlistName,
        description,
        allTracks.map(t => ({ name: t.name, artist: t.artist, durationMs: t.durationMs })),
        setExportProgress,
      );
      setExportState('saved');
      setExportSummary(
        result.skipped.length === 0
          ? `All ${result.added} tracks added to Apple Music in order.`
          : `${result.added} of ${result.total} tracks added in order. Not found on Apple Music: ${result.skipped.join('; ')}`,
      );
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
      setExportState('error');
    } finally {
      setExportProgress('');
    }
  }

  function handleCopyList() {
    const lines = allTracks.map((t, i) => `${i + 1}. ${t.name} — ${t.artist} (${t.bpm} BPM)`);
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSave() {
    setSaveState('saving');
    setSaveError('');

    const genreLabel = config.genre === 'Decades' && config.decade
      ? `${config.decade} ${config.genre}`
      : config.genre;
    const playlistName = `Spinphony · ${genreLabel} · ${config.bpm} BPM · ${config.durationMinutes}min`;
    const description = `Auto-generated spin class playlist by Spinphony. ${config.durationMinutes}-min ${genreLabel} class at ${config.bpm} BPM.`;

    try {
      if (isSpotify) {
        const user = await spotifyService.getCurrentUser();
        const pl = await spotifyService.createPlaylist(user.id, playlistName, description);
        await spotifyService.addTracksToPlaylist(pl.id, allTracks.map(t => t.uri));
      } else {
        await appleMusicService.savePlaylist(playlistName, allTracks.map(t => t.id));
      }
      setSaveState('saved');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
      setSaveState('error');
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Music2 size={18} className="text-spin-accent" />
            Your Playlist
          </h2>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatTotalDuration(totalDurationMs)}
            </span>
            <span>·</span>
            <span>{trackCount} tracks</span>
            <span>·</span>
            <span className={withinTarget ? 'text-green-400' : 'text-amber-400'}>
              {withinTarget ? `Within ${targetMin}min target` : `${diff}min off target`}
            </span>
          </div>
        </div>

        <button
          onClick={onRegenerate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white border border-spin-border hover:border-spin-accent/40 transition-all"
        >
          <RefreshCw size={12} />
          Regenerate
        </button>
      </div>

      {note && (
        <div className="flex items-center gap-2 bg-sky-500/10 border border-sky-500/30 rounded-xl p-3">
          <Info size={14} className="text-sky-400 shrink-0" />
          <p className="text-sky-300 text-xs">{note}</p>
        </div>
      )}

      {/* Progress bar showing class structure */}
      <div className="flex rounded-full h-2 overflow-hidden gap-0.5">
        {segments.map((seg, i) => {
          const segMs = seg.tracks.reduce((s, t) => s + t.durationMs, 0);
          const pct = (segMs / totalDurationMs) * 100;
          const colors: Record<string, string> = {
            warmup: 'bg-amber-400', flat: 'bg-blue-400', climb: 'bg-orange-400',
            sprint: 'bg-red-400', recovery: 'bg-green-400', jump: 'bg-yellow-400', cooldown: 'bg-cyan-400',
          };
          return (
            <div
              key={i}
              className={`${colors[seg.type] ?? 'bg-gray-400'} transition-all`}
              style={{ width: `${pct}%` }}
              title={seg.type}
            />
          );
        })}
      </div>

      {/* Track list grouped by segment */}
      <div className="flex flex-col gap-6">
        {segments.map((seg, segIdx) => {
          if (seg.tracks.length === 0) return null;
          const segMs = seg.tracks.reduce((s, t) => s + t.durationMs, 0);
          // Running track index offset
          const offset = segments.slice(0, segIdx).reduce((s, sg) => s + sg.tracks.length, 0);
          return (
            <div key={segIdx} className="flex flex-col gap-2">
              <SegmentLabel type={seg.type} trackCount={seg.tracks.length} totalMs={segMs} />
              <div className="flex flex-col gap-1.5">
                {seg.tracks.map((track, i) => (
                  <TrackCard key={track.id} track={track} index={offset + i} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save / copy button */}
      <div className="sticky bottom-4 mt-2">
        {saveState === 'error' && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-2">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <p className="text-red-300 text-xs">{saveError}</p>
          </div>
        )}

        {isDeezer ? (
          <div className="flex flex-col gap-2">
            {exportState === 'error' && (
              <div className="flex items-center gap-2 bg-red-950 border border-red-500/30 rounded-xl p-3 shadow-xl">
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <p className="text-red-300 text-xs">{exportError}</p>
              </div>
            )}
            {exportSummary && (
              <div className="flex items-center gap-2 bg-pink-950 border border-pink-500/30 rounded-xl p-3 shadow-xl">
                <CheckCircle size={14} className="text-pink-400 shrink-0" />
                <p className="text-pink-300 text-xs">{exportSummary}</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleCopyList}
                className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all shadow-xl bg-emerald-600 hover:bg-emerald-500 text-white active:scale-[0.98] shadow-emerald-500/30"
              >
                {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Track List</>}
              </button>
              <button
                onClick={handleExportToAppleMusic}
                disabled={exportState === 'saving' || exportState === 'saved'}
                className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all shadow-xl ${
                  exportState === 'saved'
                    ? 'bg-pink-700 text-white cursor-default'
                    : exportState === 'saving'
                    ? 'bg-pink-500/60 text-white cursor-not-allowed'
                    : 'bg-pink-500 hover:bg-pink-400 text-white active:scale-[0.98] shadow-pink-500/30'
                }`}
              >
                {exportState === 'saved' ? (
                  <><CheckCircle size={16} /> Exported!</>
                ) : exportState === 'saving' ? (
                  <><Save size={16} className="animate-pulse" /> {exportProgress || 'Exporting…'}</>
                ) : (
                  <><Music2 size={16} /> Export to Apple Music</>
                )}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleSave}
            disabled={saveState === 'saving' || saveState === 'saved'}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all shadow-xl ${
              saveState === 'saved'
                ? 'bg-green-600 text-white cursor-default'
                : saveState === 'saving'
                ? 'bg-spin-accent/60 text-white cursor-not-allowed'
                : isSpotify
                ? 'bg-[#1DB954] hover:bg-[#1ed760] text-black active:scale-[0.98] shadow-[#1DB954]/30'
                : 'bg-pink-500 hover:bg-pink-400 text-white active:scale-[0.98] shadow-pink-500/30'
            }`}
          >
            {saveState === 'saved' ? (
              <><CheckCircle size={16} /> Saved to {isSpotify ? 'Spotify' : 'Apple Music'}!</>
            ) : saveState === 'saving' ? (
              <><Save size={16} className="animate-pulse" /> Saving…</>
            ) : (
              <><Save size={16} /> Save to {isSpotify ? 'Spotify' : 'Apple Music'}</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
