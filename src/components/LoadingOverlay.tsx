interface Props {
  message: string;
}

export default function LoadingOverlay({ message }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20">
      {/* Vinyl record animation */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border-4 border-spin-accent/30 animate-spin" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-2 rounded-full bg-spin-border animate-spin" style={{ animationDuration: '3s' }}>
          <div className="absolute inset-0 rounded-full border-2 border-spin-accent/20" />
          <div className="absolute inset-[35%] rounded-full bg-spin-accent" />
        </div>
        <div className="absolute inset-[38%] rounded-full bg-white/90" />
      </div>
      <div className="text-center">
        <p className="text-white font-semibold text-lg">Building your playlist…</p>
        <p className="text-gray-400 text-sm mt-1">{message}</p>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="w-1.5 bg-spin-accent rounded-full animate-pulse"
            style={{
              height: `${12 + Math.random() * 20}px`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
