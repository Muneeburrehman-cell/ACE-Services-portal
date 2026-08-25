'use client';

export function DeadlineCountdown({ deadline }: { deadline: string | null }) {
  if (!deadline) return <span className="text-zinc-600 text-xs">—</span>;

  const now = new Date();
  const due = new Date(deadline);
  const diff = due.getTime() - now.getTime();

  if (diff < 0) return (
    <span className="inline-flex items-center gap-1 text-red-400 text-xs font-bold">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
      Overdue
    </span>
  );

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);

  const color = days === 0 ? 'text-red-400' : days <= 2 ? 'text-orange-400' : days <= 7 ? 'text-yellow-400' : 'text-green-400';

  return (
    <span className={`text-xs font-semibold ${color}`}>
      {days > 0 ? `${days}d ` : ''}{hours}h
    </span>
  );
}
