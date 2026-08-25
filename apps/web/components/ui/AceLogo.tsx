export function AceLogo({ size = 32, showText = true }: { size?: number; showText?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        style={{ width: size, height: size }}
        className="rounded-xl bg-yellow-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-yellow-400/20"
      >
        <svg style={{ width: size * 0.6, height: size * 0.6 }} viewBox="0 0 24 24" fill="currentColor" className="text-zinc-900">
          <path d="M12 2C8.5 2 5.5 4 4.2 7H4a2 2 0 00-2 2v1a1 1 0 001 1h1v1a1 1 0 001 1h14a1 1 0 001-1v-1h1a1 1 0 001-1V9a2 2 0 00-2-2h-.2C19.5 4 16.5 2 12 2z" />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="font-display font-bold text-white tracking-wide" style={{ fontSize: size * 0.45 }}>ACE SERVICES</span>
          <span className="text-zinc-500 uppercase tracking-widest" style={{ fontSize: size * 0.22 }}>Estimation Portal</span>
        </div>
      )}
    </div>
  );
}
