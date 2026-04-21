import { Music2 } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-spin-border bg-spin-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-spin-accent shadow-lg shadow-spin-accent/30">
          <Music2 size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight leading-none">Spinphony</h1>
          <p className="text-xs text-gray-500 mt-0.5">Spin Class Playlist Generator</p>
        </div>
      </div>
    </header>
  );
}
