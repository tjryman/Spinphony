import { ExternalLink, Music, AlertCircle } from 'lucide-react';
import * as spotifyService from '../services/spotify';
import * as appleMusicService from '../services/appleMusic';
import type { Platform } from '../types';

interface Props {
  platform: Platform;
  onConnected: () => void;
}

export default function ConnectPlatform({ platform, onConnected }: Props) {
  const isSpotify = platform === 'spotify';

  async function handleConnect() {
    if (isSpotify) {
      if (!spotifyService.isConfigured()) {
        alert(
          'Spotify Client ID is not configured.\n\n' +
          'Create a .env file with VITE_SPOTIFY_CLIENT_ID=your_id.\n' +
          'See .env.example for details.',
        );
        return;
      }
      await spotifyService.initiateAuth();
    } else {
      try {
        if (!appleMusicService.isConfigured()) {
          alert(
            'Apple Music developer token is not configured.\n\n' +
            'Set VITE_APPLE_MUSIC_DEV_TOKEN in your .env file.\n' +
            'See .env.example for details.',
          );
          return;
        }
        await appleMusicService.authorize();
        onConnected();
      } catch (err) {
        alert(`Apple Music connection failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div
        className={`flex items-center justify-center w-16 h-16 rounded-2xl ${
          isSpotify ? 'bg-[#1DB954]/20' : 'bg-pink-500/20'
        }`}
      >
        <Music size={28} className={isSpotify ? 'text-[#1DB954]' : 'text-pink-400'} />
      </div>

      <div className="text-center">
        <h3 className="text-white font-semibold text-lg">
          Connect to {isSpotify ? 'Spotify' : 'Apple Music'}
        </h3>
        <p className="text-gray-400 text-sm mt-1 max-w-xs">
          {isSpotify
            ? 'Log in with Spotify to search top charts and save generated playlists to your library.'
            : 'Authorize Apple Music to search charts and save playlists directly to your library.'}
        </p>
      </div>

      <button
        onClick={handleConnect}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
          isSpotify
            ? 'bg-[#1DB954] hover:bg-[#1ed760] text-black'
            : 'bg-pink-500 hover:bg-pink-400 text-white'
        }`}
      >
        Connect {isSpotify ? 'Spotify' : 'Apple Music'}
        <ExternalLink size={14} />
      </button>

      {!spotifyService.isConfigured() && isSpotify && (
        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 max-w-sm">
          <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-amber-300 text-xs">
            Add your Spotify Client ID to a <code className="font-mono bg-white/10 px-1 rounded">.env</code> file.
            {' '}See <code className="font-mono bg-white/10 px-1 rounded">.env.example</code> for setup instructions.
          </p>
        </div>
      )}
    </div>
  );
}
