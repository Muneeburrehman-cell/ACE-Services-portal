'use client';

const cfg: Record<string, { cls: string; label: string }> = {
  low:    { cls: 'bg-zinc-700 text-zinc-300',             label: '↓ Low' },
  medium: { cls: 'bg-blue-500/15 text-blue-300',          label: '→ Medium' },
  high:   { cls: 'bg-orange-500/15 text-orange-300',      label: '↑ High' },
  urgent: { cls: 'bg-red-500/15 text-red-300 animate-pulse', label: '⚡ Urgent' },
};

export function PriorityBadge({ priority }: { priority: string }) {
  const c = cfg[priority] ?? cfg.low;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${c.cls}`}>
      {c.label}
    </span>
  );
}
