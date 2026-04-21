import { useEffect, useState, useCallback } from 'react';
import Header from './components/Header';
import ConnectPlatform from './components/ConnectPlatform';
import PlaylistForm from './components/PlaylistForm';
import PlaylistDisplay from './components/PlaylistDisplay';
import LoadingOverlay from './components/LoadingOverlay';
import type { Platform, PlaylistConfig, GeneratedPlaylist } from './types';
import * as spotifyService from './services/spotify';
import * as appleMusicService from './services/appleMusic';
import { buildSpotifyPlaylist, buildAppleMusicPlaylist } from './services/playlistBuilder';

type AppState = 'select-platform' | 'connect' | 'build' | 'result';

export default function App() {
  const [platform, setPlatform] = useState<Platform>('spotify');
  const [appState, setAppState] = useState<AppState>('select-platform');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [playlist, setPlaylist] = useState<GeneratedPlaylist | null>(null);
  const [error, setError] = useState('');
  const [spotifyUser, setSpotifyUser] = useState('');
  const [lastConfig, setLastConfig] = useState<PlaylistConfig | null>(null);

  // ── On load: handle OAuth callback OR restore existing session ─────────────
  useEffect(() => {
    async function init() {
      const params = new URLSearchParams(window.location.search);

      // Spotify redirected back with auth code — SDK handles the exchange
      if (params.has('code') || params.has('error')) {
        if (params.has('error')) {
          setError(`Spotify auth denied: ${params.get('error')}`);
          window.history.replaceState({}, '', '/');
          setAppState('select-platform');
          return;
        }
        try {
          const ok = await spotifyService.authenticate();
          window.history.replaceState({}, '', '/');
          if (ok) {
            const user = await spotifyService.getCurrentUser().catch(() => null);
            if (user) setSpotifyUser(user.display_name);
            setPlatform('spotify');
            setAppState('build');
          } else {
            setAppState('select-platform');
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Spotify auth failed');
          window.history.replaceState({}, '', '/');
          setAppState('select-platform');
        }
        return;
      }

      // Check for existing Spotify session
      const alreadyAuthed = await spotifyService.isAuthenticated();
      if (alreadyAuthed) {
        const user = await spotifyService.getCurrentUser().catch(() => null);
        if (user) setSpotifyUser(user.display_name);
        setPlatform('spotify');
        setAppState('build');
        return;
      }

      // Check for Apple Music session
      if (appleMusicService.isAuthorized()) {
        setPlatform('apple-music');
        setAppState('build');
      }
    }

    init();
  }, []);

  // ── Platform selection ──────────────────────────────────────────────────────
  function selectPlatform(p: Platform) {
    setPlatform(p);
    setAppState('connect');
  }

  async function handleConnected() {
    if (platform === 'spotify') {
      const user = await spotifyService.getCurrentUser().catch(() => null);
      if (user) setSpotifyUser(user.display_name);
    }
    setAppState('build');
  }

  function handleDisconnect() {
    if (platform === 'spotify') {
      spotifyService.disconnect();
      setSpotifyUser('');
    } else {
      appleMusicService.disconnect();
    }
    setPlaylist(null);
    setAppState('select-platform');
  }

  // ── Playlist generation ─────────────────────────────────────────────────────
  const generate = useCallback(async (config: PlaylistConfig) => {
    setIsGenerating(true);
    setError('');
    setLastConfig(config);
    try {
      const result = config.platform === 'spotify'
        ? await buildSpotifyPlaylist(config, setProgress)
        : await buildAppleMusicPlaylist(config, setProgress);
      setPlaylist(result);
      setAppState('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate playlist');
    } finally {
      setIsGenerating(false);
      setProgress('');
    }
  }, []);

  function handleRegenerate() {
    if (lastConfig) generate(lastConfig);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-spin-bg text-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Platform selection */}
        {appState === 'select-platform' && (
          <div className="flex flex-col items-center gap-8 py-12">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-white">Build Your Spin Playlist</h2>
              <p className="text-gray-400 mt-2 max-w-md">
                Auto-generate a perfectly structured spin class playlist using top charts and search results.
                Choose your streaming platform to get started.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 w-full max-w-lg">
              <button
                onClick={() => selectPlatform('spotify')}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-spin-border bg-spin-card hover:border-[#1DB954]/50 hover:bg-[#1DB954]/5 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#1DB954]/20 flex items-center justify-center group-hover:bg-[#1DB954]/30 transition-colors">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 fill-[#1DB954]">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-bold text-white">Spotify</p>
                  <p className="text-xs text-gray-500 mt-0.5">Connect with OAuth</p>
                </div>
              </button>

              <button
                onClick={() => selectPlatform('apple-music')}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-spin-border bg-spin-card hover:border-pink-500/50 hover:bg-pink-500/5 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-pink-500/20 flex items-center justify-center group-hover:bg-pink-500/30 transition-colors">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 fill-pink-400">
                    <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.048-2.31-2.08-3.03a7.322 7.322 0 00-1.78-.73 13.104 13.104 0 00-2.58-.43c-.84-.06-1.67-.09-2.5-.09H9.19a35.145 35.145 0 00-2.49.09 13.104 13.104 0 00-2.58.43 7.322 7.322 0 00-1.78.73C1.3 1.624.569 2.624.252 3.934A9.23 9.23 0 00.012 6.124C-.002 6.84 0 7.56 0 8.28v7.44c0 .72-.002 1.44.012 2.156a9.23 9.23 0 00.24 2.19c.317 1.31 1.048 2.31 2.08 3.03.62.41 1.28.7 1.78.73.84.17 1.71.27 2.58.43.84.06 1.67.09 2.5.09h5.64c.83 0 1.66-.03 2.5-.09a13.104 13.104 0 002.58-.43c.5-.03 1.16-.32 1.78-.73 1.032-.72 1.763-1.72 2.08-3.03a9.23 9.23 0 00.24-2.19c.014-.716.012-1.436.012-2.156V8.28c0-.72.002-1.44-.012-2.156zM12 17.5a5.5 5.5 0 110-11 5.5 5.5 0 010 11zm5.5-9.75a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z"/>
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-bold text-white">Apple Music</p>
                  <p className="text-xs text-gray-500 mt-0.5">Requires developer token</p>
                </div>
              </button>
            </div>

            <div className="w-full max-w-2xl grid grid-cols-3 gap-3">
              {[
                { icon: '⛰️', label: 'Climbs', bpm: '60–75 BPM' },
                { icon: '🛣️', label: 'Endurance', bpm: '80–95 BPM' },
                { icon: '⚡', label: 'Sprints', bpm: '100–120 BPM' },
              ].map(item => (
                <div key={item.label} className="flex flex-col items-center gap-1 bg-spin-card border border-spin-border rounded-xl p-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-xs font-semibold text-white">{item.label}</span>
                  <span className="text-xs text-gray-500 font-mono">{item.bpm}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connect to platform */}
        {appState === 'connect' && (
          <div className="max-w-sm mx-auto bg-spin-card border border-spin-border rounded-2xl p-6 mt-8">
            <button
              onClick={() => setAppState('select-platform')}
              className="text-xs text-gray-500 hover:text-gray-300 mb-4 transition-colors"
            >
              ← Back
            </button>
            <ConnectPlatform platform={platform} onConnected={handleConnected} />
          </div>
        )}

        {/* Builder + result */}
        {(appState === 'build' || appState === 'result') && (
          <div className="grid lg:grid-cols-[380px,1fr] gap-6 items-start">
            <div className="bg-spin-card border border-spin-border rounded-2xl p-5 lg:sticky lg:top-24">
              <PlaylistForm
                platform={platform}
                onGenerate={generate}
                isGenerating={isGenerating}
                onDisconnect={handleDisconnect}
                userDisplayName={spotifyUser || undefined}
              />
            </div>

            <div className="bg-spin-card border border-spin-border rounded-2xl p-5 min-h-[400px]">
              {isGenerating && <LoadingOverlay message={progress} />}

              {!isGenerating && error && (
                <div className="flex flex-col items-center gap-4 py-16 text-center">
                  <div className="text-4xl">😬</div>
                  <div>
                    <p className="text-white font-semibold">Something went wrong</p>
                    <p className="text-gray-400 text-sm mt-1 max-w-sm">{error}</p>
                  </div>
                  <button
                    onClick={() => { setError(''); setAppState('build'); }}
                    className="px-4 py-2 rounded-xl border border-spin-border text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Try again
                  </button>
                </div>
              )}

              {!isGenerating && !error && !playlist && (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-spin-border flex items-center justify-center">
                    <span className="text-3xl">🎵</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">No playlist yet</p>
                    <p className="text-gray-500 text-sm mt-1">
                      Configure your class options and hit <strong className="text-gray-400">Generate Playlist</strong>
                    </p>
                  </div>
                </div>
              )}

              {!isGenerating && !error && playlist && (
                <PlaylistDisplay playlist={playlist} onRegenerate={handleRegenerate} />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
