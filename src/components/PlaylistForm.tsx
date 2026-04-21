import { useState } from 'react';
import { Zap } from 'lucide-react';
import type { BPMOption, GenreOption, DecadeOption, PlaylistLength, PlaylistConfig, Platform } from '../types';

const BPM_OPTIONS: BPMOption[] = [30, 40, 50, 60, 70, 80, 90, 100, 110, 120];

const GENRES: GenreOption[] = [
  'Pop', 'Hip-Hop', 'Country', 'Funk', 'Dance', 'Hits',
  'Rock', 'Metal', 'Indie', 'K-Pop', 'J-Pop', 'Emo',
  'Gospel', 'R&B', 'Alternative', 'Latin', 'Punk', 'Reggae', 'Decades',
];

const DECADES: DecadeOption[] = ['70s', '80s', '90s', '2000s', '2010s', '2020s'];

interface Props {
  platform: Platform;
  onGenerate: (config: PlaylistConfig) => void;
  isGenerating: boolean;
  onDisconnect: () => void;
  userDisplayName?: string;
}

function SelectField<T extends string | number>({
  label,
  value,
  options,
  onChange,
  renderOption,
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (v: T) => void;
  renderOption?: (v: T) => string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</label>
      <select
        value={String(value)}
        onChange={e => onChange(e.target.value as unknown as T)}
        className="bg-spin-border border border-spin-border text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-spin-accent/60 focus:border-spin-accent appearance-none cursor-pointer"
      >
        {options.map(opt => (
          <option key={String(opt)} value={String(opt)}>
            {renderOption ? renderOption(opt) : String(opt)}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function PlaylistForm({ platform, onGenerate, isGenerating, onDisconnect, userDisplayName }: Props) {
  const [bpm, setBpm] = useState<BPMOption>(90);
  const [genre, setGenre] = useState<GenreOption>('Pop');
  const [decade, setDecade] = useState<DecadeOption>('90s');
  const [duration, setDuration] = useState<PlaylistLength>(45);
  const [coolDown, setCoolDown] = useState(false);

  const isSpotify = platform === 'spotify';

  function handleGenre(g: GenreOption) {
    setGenre(g);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onGenerate({
      bpm,
      genre,
      decade: genre === 'Decades' ? decade : undefined,
      durationMinutes: duration,
      coolDown,
      platform,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Connected account */}
      <div className="flex items-center justify-between bg-spin-border/60 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${isSpotify ? 'bg-[#1DB954]' : 'bg-pink-400'}`} />
          <span className="text-sm text-gray-300">
            {isSpotify ? 'Spotify' : 'Apple Music'}
            {userDisplayName ? ` · ${userDisplayName}` : ''}
          </span>
        </div>
        <button
          type="button"
          onClick={onDisconnect}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Disconnect
        </button>
      </div>

      {/* BPM */}
      <SelectField
        label="Target BPM"
        value={bpm}
        options={BPM_OPTIONS}
        onChange={v => setBpm(Number(v) as BPMOption)}
        renderOption={v => `${v}${v === 120 ? '+ BPM (Sprints)' : v <= 75 ? ` BPM (Climbs)` : ` BPM`}`}
      />

      {/* Genre */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Genre</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
          {GENRES.map(g => (
            <button
              key={g}
              type="button"
              onClick={() => handleGenre(g)}
              className={`px-2 py-2 rounded-lg text-xs font-medium transition-all border ${
                genre === g
                  ? 'bg-spin-accent border-spin-accent text-white shadow-lg shadow-spin-accent/25'
                  : 'bg-spin-border border-transparent text-gray-400 hover:text-white hover:border-spin-border'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Decade sub-selector (shown only when Decades is selected) */}
      {genre === 'Decades' && (
        <div className="flex flex-col gap-1.5 pl-3 border-l-2 border-spin-accent/40">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Decade</label>
          <div className="flex flex-wrap gap-1.5">
            {DECADES.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setDecade(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  decade === d
                    ? 'bg-spin-accent border-spin-accent text-white'
                    : 'bg-spin-border border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {d === '70s' ? "70's" : d === '80s' ? "80's" : d === '90s' ? "90's" : d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Playlist length */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Playlist Length</label>
        <div className="flex gap-2">
          {([30, 45, 60] as PlaylistLength[]).map(len => (
            <button
              key={len}
              type="button"
              onClick={() => setDuration(len)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                duration === len
                  ? 'bg-spin-accent border-spin-accent text-white shadow-lg shadow-spin-accent/25'
                  : 'bg-spin-border border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {len} min
            </button>
          ))}
        </div>
      </div>

      {/* Cool Down */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Cool Down</label>
        <div className="flex items-center gap-4 bg-spin-border/50 rounded-xl px-4 py-3">
          <div className="flex-1">
            <p className="text-sm text-gray-300">Add 2 slower songs at the end</p>
            <p className="text-xs text-gray-500 mt-0.5">Gradual heart rate recovery</p>
          </div>
          <button
            type="button"
            onClick={() => setCoolDown(v => !v)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              coolDown ? 'bg-spin-accent' : 'bg-spin-border'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                coolDown ? 'left-6' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Generate button */}
      <button
        type="submit"
        disabled={isGenerating}
        className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-spin-accent hover:bg-spin-accent-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base transition-all shadow-xl shadow-spin-accent/30 active:scale-[0.98]"
      >
        <Zap size={18} className={isGenerating ? 'animate-pulse' : ''} />
        {isGenerating ? 'Generating…' : 'Generate Playlist'}
      </button>

      <p className="text-xs text-gray-600 text-center">
        Scans top {isSpotify ? 'Spotify' : 'Apple Music'} charts + search results.
        Songs appearing in multiple charts are prioritised.
      </p>
    </form>
  );
}
