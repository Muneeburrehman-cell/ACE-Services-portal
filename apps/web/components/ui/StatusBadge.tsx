'use client';

const cfg: Record<string, { cls: string; dot: string; label: string }> = {
  received:       { cls: 'bg-blue-500/15 text-blue-300 border-blue-500/30',      dot: 'bg-blue-400',    label: 'Received' },
  proposal:       { cls: 'bg-purple-500/15 text-purple-300 border-purple-500/30', dot: 'bg-purple-400', label: 'Proposal Sent' },
  follow_up:      { cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30',   dot: 'bg-amber-400',   label: 'Follow-Up' },
  approved:       { cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400', label: 'Approved' },
  declined:       { cls: 'bg-red-500/15 text-red-300 border-red-500/30',          dot: 'bg-red-400',     label: 'Declined' },
  assigned:       { cls: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30', dot: 'bg-yellow-400', label: 'Assigned' },
  in_progress:    { cls: 'bg-orange-500/15 text-orange-300 border-orange-500/30', dot: 'bg-orange-400', label: 'In Progress' },
  delivered:      { cls: 'bg-teal-500/15 text-teal-300 border-teal-500/30',      dot: 'bg-teal-400',    label: 'Deliverables Ready' },
  sent_to_client: { cls: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', dot: 'bg-indigo-400', label: 'Delivered to Client' },
};

export function StatusBadge({ status, forBD }: { status: string; forBD?: boolean }) {
  const c = cfg[status] ?? {
    cls: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    dot: 'bg-zinc-400',
    label: status ? status.replace(/_/g, ' ') : 'Unknown',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      <span className="capitalize">{c.label}</span>
    </span>
  );
}
