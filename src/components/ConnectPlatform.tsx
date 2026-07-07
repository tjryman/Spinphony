import { useState } from 'react';
import { ExternalLink, Music, Copy, Check, AlertTriangle } from 'lucide-react';
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
      await spotifyService.authenticate();
    } else {
      try {
        if (!appleMusicService.isConfigured()) {
          alert('Apple Music developer token is not configured. Set VITE_APPLE_MUSIC_DEV_TOKEN in your .env file.');
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
    <div className="flex flex-col gap-5 py-4">
      <div className="flex items-center gap-3">
        <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${isSpotify ? 'bg-[#1DB954]/20' : 'bg-pink-500/20'}`}>
          <Music size={22} className={isSpotify ? 'text-[#1DB954]' : 'text-pink-400'} />
        </div>
        <div>
          <h3 className="text-white font-semibold">Connect to {isSpotify ? 'Spotify' : 'Apple Music'}</h3>
          <p className="text-gray-500 text-xs mt-0.5">Authorize to search charts and save playlists</p>
        </div>
      </div>

      {isSpotify && (
        <>
          {/* Step 1 — Spotify dashboard setup */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-400 shrink-0" />
              <p className="text-amber-300 text-xs font-semibold uppercase tracking-wide">
                Do this first in Spotify Dashboard
              </p>
            </div>

            <ol className="flex flex-col gap-2 text-xs text-gray-300">
              <li className="flex gap-2">
                <span className="text-amber-400 font-bold shrink-0">1.</span>
                <span>
                  Open{' '}
                  <a
                    href="https://developer.spotify.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-spin-accent-light underline inline-flex items-center gap-1"
                  >
                    developer.spotify.com/dashboard <ExternalLink size={10} />
                  </a>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400 font-bold shrink-0">2.</span>
                <span>Click your app → <strong className="text-white">Settings</strong> → <strong className="text-white">Redirect URIs</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400 font-bold shrink-0">3.</span>
                <span><strong className="text-white">Delete all existing redirect URIs</strong>, then add exactly this one:</span>
              </li>
            </ol>

            {/* URI copy box */}
            <div className="flex items-center gap-2 bg-spin-bg rounded-lg px-3 py-2.5 border border-spin-border">
              <code className="text-green-400 text-sm font-mono flex-1 select-all">{REDIRECT_URI}</code>
              <button
                onClick={handleCopy}
                className="shrink-0 p-1 rounded text-gray-400 hover:text-white transition-colors"
                title="Copy"
              >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              </button>
            </div>

            <p className="text-xs text-gray-500">
              4. Click <strong className="text-gray-300">Add</strong> then <strong className="text-gray-300">Save</strong>
            </p>
          </div>

          {/* Step 2 — browser cert warning */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-xs text-blue-300">
            <strong className="text-blue-200">Browser warning:</strong> if your browser shows a security warning
            when you open the app at <code className="font-mono text-blue-200">https://localhost:5173</code>, click{' '}
            <strong className="text-blue-200">Advanced → Proceed to localhost</strong> — this is expected for a
            local self-signed certificate.
          </div>
        </>
      )}

      <button
        onClick={handleConnect}
        className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
          isSpotify
            ? 'bg-[#1DB954] hover:bg-[#1ed760] text-black'
            : 'bg-pink-500 hover:bg-pink-400 text-white'
        }`}
      >
        Connect {isSpotify ? 'Spotify' : 'Apple Music'}
        <ExternalLink size={14} />
      </button>
    </div>
  );
}
