'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { DeadlineCountdown } from '@/components/ui/DeadlineCountdown';

export default function EngineerDashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get<any>('/projects')
      .then(r => {
        const list = Array.isArray(r) ? r : (r?.data ?? []);
        setProjects(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    window.addEventListener('focus', load);
    const interval = setInterval(load, 15000);
    return () => {
      window.removeEventListener('focus', load);
      clearInterval(interval);
    };
  }, [load]);

  const urgent = projects.filter(p => {
    if (!p.internalDeadline) return false;
    const diff = new Date(p.internalDeadline).getTime() - Date.now();
    return diff > 0 && diff < 86400000 * 3;
  });

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-orange-400 font-semibold">Engineering Production</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">My Work Queue</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {projects.length} project{projects.length !== 1 ? 's' : ''} assigned
          </p>
        </div>

        <button
          onClick={load}
          className="btn-secondary text-xs py-2.5 px-3.5 self-start sm:self-auto"
          title="Refresh Work Queue"
        >
          <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Refresh Queue
        </button>
      </div>

      {/* Urgency Alert Ribbon */}
      {urgent.length > 0 && (
        <div className="glass-card p-4 border-red-500/40 bg-red-500/10 flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-300 flex items-center justify-center flex-shrink-0 animate-pulse">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-red-200">⚡ {urgent.length} project{urgent.length > 1 ? 's' : ''} due within 72h</p>
              <p className="text-xs text-red-300/80">Please review drawings and upload deliverables before the deadline</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-2xl shimmer border border-zinc-800" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && projects.length === 0 && (
        <div className="glass-card text-center py-16 border-dashed border-zinc-700">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center mx-auto mb-4 text-zinc-500">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-zinc-200 font-semibold text-lg">No pending assignments</p>
          <p className="text-zinc-500 text-xs mt-1">You are all caught up. When projects are assigned by the administrator, they will appear here automatically.</p>
        </div>
      )}

      {/* Table */}
      {!loading && projects.length > 0 && (
        <div className="glass-card p-0 overflow-hidden border-zinc-800 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/90">
                  <th className="px-5 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Reference</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Project Type</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Priority</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Internal Due Date</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {projects.map((p, i) => (
                  <tr
                    key={p.id}
                    className="table-row-hover group"
                    style={{ animation: `fadeInUp 0.3s ease-out ${i * 30}ms both` }}
                  >
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-yellow-400 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                        {p.referenceNumber}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-zinc-200 uppercase">
                      {p.projectType ?? 'Estimation'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {p.priority ? <PriorityBadge priority={p.priority} /> : <span className="text-zinc-500 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono whitespace-nowrap">
                      <DeadlineCountdown deadline={p.internalDeadline || p.requestedDeadline} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <Link
                        href={`/engineer/projects/${p.id}`}
                        className="btn-primary text-xs py-1.5 px-3.5"
                      >
                        Open Workspace →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
