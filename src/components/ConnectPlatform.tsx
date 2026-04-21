import { useState } from 'react';
import { ExternalLink, Music, AlertCircle, Copy, Check } from 'lucide-react';
import * as spotifyService from '../services/spotify';
import { REDIRECT_URI } from '../services/spotify';
import * as appleMusicService from '../services/appleMusic';
import type { Platform } from '../types';

interface Props {
  platform: Platform;
  onConnected: () => void;
}

export default function ConnectPlatform({ platform, onConnected }: Props) {
  const isSpotify = platform === 'spotify';
  const [copied, setCopied] = useState(false);

  async function handleConnect() {
    if (isSpotify) {
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

  function handleCopy() {
    navigator.clipboard.writeText(REDIRECT_URI);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

      {/* Redirect URI display for Spotify */}
      {isSpotify && (
        <div className="w-full max-w-sm bg-spin-border rounded-xl p-3 flex flex-col gap-2">
          <p className="text-xs text-gray-400">
            Make sure this exact URI is saved in your{' '}
            <a
              href="https://developer.spotify.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-spin-accent-light underline"
            >
              Spotify Dashboard
            </a>
            {' '}→ Settings → Redirect URIs:
          </p>
          <div className="flex items-center gap-2 bg-spin-bg rounded-lg px-3 py-2">
            <code className="text-xs text-green-400 flex-1 font-mono break-all">{REDIRECT_URI}</code>
            <button
              onClick={handleCopy}
              className="shrink-0 text-gray-400 hover:text-white transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      )}

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

      {isSpotify && (
        <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 max-w-sm">
          <AlertCircle size={16} className="text-blue-400 mt-0.5 shrink-0" />
          <p className="text-blue-300 text-xs">
            After adding the redirect URI in Spotify, click your browser's{' '}
            <strong>Advanced → Proceed to localhost</strong> if you see a security warning.
          </p>
        </div>
      )}
    </div>
  );
}
