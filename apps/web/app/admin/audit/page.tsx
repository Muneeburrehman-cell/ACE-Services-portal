'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

const EVENT_TYPES = [
  'USER_LOGIN_SUCCESS',
  'USER_LOGIN_FAILURE',
  'PROJECT_SUBMITTED',
  'PROJECT_ASSIGNED',
  'PROJECT_REASSIGNED',
  'DELIVERABLE_UPLOADED',
  'SEND_TO_CLIENT_SUCCESS',
  'SEND_TO_CLIENT_FAILURE',
  'CHAT_MESSAGE_SENT',
  'USER_ACCOUNT_CREATED',
  'USER_ACCOUNT_DEACTIVATED',
];

const eventColors: Record<string, string> = {
  USER_LOGIN_SUCCESS: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  USER_LOGIN_FAILURE: 'text-red-400 bg-red-500/10 border-red-500/30',
  PROJECT_SUBMITTED: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  PROJECT_ASSIGNED: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  PROJECT_REASSIGNED: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  DELIVERABLE_UPLOADED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  SEND_TO_CLIENT_SUCCESS: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  SEND_TO_CLIENT_FAILURE: 'text-red-400 bg-red-500/10 border-red-500/30',
  CHAT_MESSAGE_SENT: 'text-zinc-400 bg-zinc-800 border-zinc-700',
  USER_ACCOUNT_CREATED: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  USER_ACCOUNT_DEACTIVATED: 'text-red-400 bg-red-500/10 border-red-500/30',
};

export default function AuditPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [eventType, setEventType] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback((p = page, et = eventType) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: '50' });
    if (et) params.set('eventType', et);
    api.get<any>(`/audit?${params}`)
      .then(r => {
        setEntries(r.data ?? []);
        setTotal(r.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, eventType]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.ceil(total / 50) || 1;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-widest text-yellow-400 font-semibold">Immutable Record</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">Security & Audit Log</h1>
        <p className="text-zinc-400 text-sm mt-1">{total} chronological compliance events logged across the system</p>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-3 items-center flex-wrap">
        <select
          value={eventType}
          className="input w-72 text-xs"
          onChange={e => {
            setEventType(e.target.value);
            setPage(1);
            load(1, e.target.value);
          }}
        >
          <option value="">All Event Categories</option>
          {EVENT_TYPES.map(e => (
            <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>
          ))}
        </select>
        {eventType && (
          <button
            onClick={() => { setEventType(''); setPage(1); load(1, ''); }}
            className="btn-secondary text-xs py-2 px-3"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-14 rounded-2xl shimmer border border-zinc-800" />
          ))}
        </div>
      ) : (
        <div className="glass-card p-0 overflow-hidden border-zinc-800 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/90">
                  <th className="px-5 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Timestamp</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Event Type</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Actor</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Metadata / Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {entries.map((e, i) => (
                  <tr
                    key={e.id}
                    className="table-row-hover"
                    style={{ animation: `fadeInUp 0.25s ease-out ${i * 20}ms both` }}
                  >
                    <td className="px-5 py-3.5 text-xs text-zinc-400 font-mono whitespace-nowrap">
                      {new Date(e.occurredAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`text-[11px] font-bold font-mono px-2.5 py-1 rounded-md border ${eventColors[e.eventType] ?? 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                        {e.eventType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-200 whitespace-nowrap font-medium">
                      {e.actor?.fullName ?? (
                        <span className="text-zinc-500 italic">System</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-400 font-mono max-w-md truncate">
                      {e.metadata ? JSON.stringify(e.metadata) : '—'}
                    </td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-14 text-center text-zinc-500 italic">
                      No audit log entries matching this filter
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              const p = Math.max(1, page - 1);
              setPage(p);
              load(p);
            }}
            disabled={page === 1}
            className="btn-secondary text-xs py-2 px-4"
          >
            ← Previous Page
          </button>
          <span className="text-zinc-400 text-xs font-mono">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => {
              const p = Math.min(totalPages, page + 1);
              setPage(p);
              load(p);
            }}
            disabled={page >= totalPages}
            className="btn-secondary text-xs py-2 px-4"
          >
            Next Page →
          </button>
        </div>
      )}
    </div>
  );
}
