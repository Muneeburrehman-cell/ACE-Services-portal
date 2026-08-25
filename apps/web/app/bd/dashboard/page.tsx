'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function BDDashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState<'all' | 'estimation' | 'design_drafting'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Follow-up modal state
  const [followUpModalProject, setFollowUpModalProject] = useState<any | null>(null);
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [followUpNotes, setFollowUpNotes] = useState<string>('');
  const [savingFollowUp, setSavingFollowUp] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get<any>('/projects')
      .then((r) => {
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

  async function updateStatus(projectId: string, newStatus: string) {
    setUpdatingId(projectId);
    try {
      await api.patch(`/projects/${projectId}/status`, { status: newStatus });
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed to update project status');
    } finally {
      setUpdatingId(null);
    }
  }

  function openFollowUpModal(project: any) {
    setFollowUpModalProject(project);
    // Default follow-up date: 2 days from now
    const d = new Date();
    d.setDate(d.getDate() + 2);
    setFollowUpDate(project.followUpDate ? project.followUpDate.split('T')[0] : d.toISOString().split('T')[0]);
    setFollowUpNotes(project.followUpNotes || '');
  }

  function setQuickDuration(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setFollowUpDate(d.toISOString().split('T')[0]);
  }

  async function handleSaveFollowUp() {
    if (!followUpModalProject) return;
    setSavingFollowUp(true);
    try {
      await api.patch(`/projects/${followUpModalProject.id}/status`, {
        status: 'follow_up',
        followUpDate: followUpDate ? new Date(followUpDate).toISOString() : null,
        followUpNotes,
      });
      setFollowUpModalProject(null);
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed to save follow-up');
    } finally {
      setSavingFollowUp(false);
    }
  }

  // Filter projects by department & status
  const filteredProjects = projects.filter((p) => {
    if (deptFilter !== 'all' && (p.projectType || 'estimation') !== deptFilter) {
      return false;
    }
    if (statusFilter !== 'all' && p.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const totalValue = projects.reduce((acc, p) => acc + (Number(p.decidedPrice) || Number(p.totalPrice) || 0), 0);

  return (
    <div className="space-y-7">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">BD Workspace</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">Client Pipeline & Submissions</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={load}
            className="btn-secondary text-xs py-2.5 px-3.5 cursor-pointer"
            title="Refresh submissions"
          >
            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Refresh
          </button>
          <Link
            href="/bd/submit"
            className="btn-primary text-xs py-2.5 px-5 animate-pulse-glow flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Submit New Project
          </Link>
        </div>
      </div>

      {/* Commercial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-5 border-zinc-800">
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Submissions</p>
          <p className="font-display text-3xl font-bold text-white">{projects.length}</p>
          <p className="text-zinc-500 text-xs mt-1">Total active & logged deals</p>
        </div>
        <div className="glass-card p-5 border-emerald-500/30 bg-emerald-500/5">
          <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">Agreed Value</p>
          <p className="font-display text-3xl font-bold text-emerald-400">
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-zinc-500 text-xs mt-1">Total cumulative contract volume</p>
        </div>
        <div className="glass-card p-5 border-blue-500/30 bg-blue-500/5">
          <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">Cost Estimation</p>
          <p className="font-display text-3xl font-bold text-blue-400">
            {projects.filter(p => (p.projectType || 'estimation') === 'estimation').length}
          </p>
          <p className="text-zinc-500 text-xs mt-1">Quantity takeoffs & material bids</p>
        </div>
        <div className="glass-card p-5 border-purple-500/30 bg-purple-500/5">
          <p className="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">Design & Drafting</p>
          <p className="font-display text-3xl font-bold text-purple-400">
            {projects.filter(p => p.projectType === 'design_drafting').length}
          </p>
          <p className="text-zinc-500 text-xs mt-1">Architectural CAD & permit plans</p>
        </div>
      </div>

      {/* ── Department & Status Filter Bar ── */}
      <div className="glass-card p-4 border-zinc-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Department Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-900/80 rounded-xl border border-zinc-800">
            <button
              onClick={() => setDeptFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                deptFilter === 'all'
                  ? 'bg-yellow-400 text-zinc-950 shadow-md shadow-yellow-400/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Projects ({projects.length})
            </button>
            <button
              onClick={() => setDeptFilter('estimation')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                deptFilter === 'estimation'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              📐 Estimation ({projects.filter(p => (p.projectType || 'estimation') === 'estimation').length})
            </button>
            <button
              onClick={() => setDeptFilter('design_drafting')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                deptFilter === 'design_drafting'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              🏛️ Design & Drafting ({projects.filter(p => p.projectType === 'design_drafting').length})
            </button>
          </div>

          {/* Quick Status Filters */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input text-xs py-1.5 px-3 bg-zinc-900 border-zinc-700 text-zinc-200 rounded-lg cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="received">Received</option>
              <option value="proposal">Proposal Sent</option>
              <option value="follow_up">Follow-Up Active</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="delivered">Delivered Ready</option>
              <option value="sent_to_client">Sent to Client</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-2xl shimmer border border-zinc-800" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredProjects.length === 0 && (
        <div className="glass-card text-center py-16 border-dashed border-zinc-700">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center mx-auto mb-4 text-zinc-500">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          </div>
          <p className="text-zinc-200 font-semibold text-lg">No projects match the selected criteria</p>
          <p className="text-zinc-500 text-xs mt-1 mb-6">Change your department or status filter to see submissions</p>
          <button
            onClick={() => { setDeptFilter('all'); setStatusFilter('all'); }}
            className="btn-secondary text-xs py-2 px-4 cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Projects Table */}
      {!loading && filteredProjects.length > 0 && (
        <div className="glass-card p-0 overflow-hidden border-zinc-800 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/90">
                  <th className="px-4 py-3.5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Ref</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Client & Contact</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Salesperson</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Agreed Value ($)</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Department</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredProjects.map((p, i) => {
                  const isEstimation = (p.projectType || 'estimation') === 'estimation';
                  const isFollowUpDue = p.followUpDate && new Date(p.followUpDate) <= new Date();

                  return (
                    <tr
                      key={p.id}
                      className="table-row-hover group"
                      style={{ animation: `fadeInUp 0.3s ease-out ${i * 30}ms both` }}
                    >
                      {/* Reference Number */}
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-yellow-400 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                          {p.referenceNumber}
                        </div>
                        <p className="text-[10px] text-zinc-500 font-sans mt-0.5">
                          {new Date(p.submittedAt).toLocaleDateString()}
                        </p>
                      </td>

                      {/* Client Company & Contact Person */}
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-zinc-100 group-hover:text-yellow-200 transition-colors text-sm leading-tight">
                          {p.clientCompanyName || p.clientName}
                        </p>
                        {p.clientContactPerson && (
                          <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                            <span className="text-zinc-500">Contact:</span> {p.clientContactPerson}
                          </p>
                        )}
                        <p className="text-[11px] text-zinc-500 font-mono mt-0.5 truncate max-w-xs">{p.clientEmail}</p>
                      </td>

                      {/* Salesperson */}
                      <td className="px-4 py-3.5 text-xs font-medium text-zinc-300 whitespace-nowrap">
                        {p.salespersonName ? (
                          <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/80 text-zinc-200">
                            {p.salespersonName}
                          </span>
                        ) : (
                          <span className="text-zinc-600 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Decided Price */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {p.decidedPrice ? (
                          <span className="font-mono text-sm font-bold text-emerald-400">
                            ${Number(p.decidedPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-600 font-mono">TBD</span>
                        )}
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${
                          isEstimation
                            ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {isEstimation ? '📐 Estimation' : '🏛️ Drafting'}
                        </span>
                      </td>

                      {/* Status & Follow-Up details */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="space-y-1">
                          <StatusBadge status={p.status} />
                          {p.followUpDate && (
                            <div className={`text-[10px] flex items-center gap-1 font-mono ${
                              isFollowUpDue ? 'text-amber-400 font-bold' : 'text-zinc-400'
                            }`}>
                              <span>📅 Follow-Up:</span>
                              <span>{new Date(p.followUpDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          {p.followUpNotes && (
                            <p className="text-[10px] text-zinc-400 italic max-w-xs truncate" title={p.followUpNotes}>
                              "{p.followUpNotes}"
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status Action Buttons with Short Headings */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Proposal Button */}
                          <button
                            disabled={updatingId === p.id}
                            onClick={() => updateStatus(p.id, 'proposal')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              p.status === 'proposal'
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                                : 'bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/30'
                            }`}
                            title="Mark Proposal Sent"
                          >
                            Proposal
                          </button>

                          {/* Approved Button */}
                          <button
                            disabled={updatingId === p.id}
                            onClick={() => updateStatus(p.id, 'approved')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              p.status === 'approved'
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                                : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30'
                            }`}
                            title="Mark Client Approved"
                          >
                            Approved
                          </button>

                          {/* Declined Button */}
                          <button
                            disabled={updatingId === p.id}
                            onClick={() => updateStatus(p.id, 'declined')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              p.status === 'declined'
                                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                                : 'bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/30'
                            }`}
                            title="Mark Client Declined"
                          >
                            Declined
                          </button>

                          {/* Follow-Up Button */}
                          <button
                            disabled={updatingId === p.id}
                            onClick={() => openFollowUpModal(p)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                              p.status === 'follow_up'
                                ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/30'
                                : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
                            }`}
                            title="Set Follow-Up Reminder"
                          >
                            <span>Follow-Up</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Follow-Up Scheduler Modal ── */}
      {followUpModalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card max-w-md w-full p-6 space-y-5 border-zinc-700 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <p className="text-xs font-mono text-yellow-400 font-semibold">{followUpModalProject.referenceNumber}</p>
                <h3 className="text-base font-bold text-white mt-0.5">Schedule Client Follow-Up</h3>
              </div>
              <button
                onClick={() => setFollowUpModalProject(null)}
                className="text-zinc-500 hover:text-white text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Quick Duration Preset Buttons */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
                  Quick Duration Presets
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickDuration(2)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer text-center"
                  >
                    +2 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDuration(4)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer text-center"
                  >
                    +4 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDuration(7)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer text-center"
                  >
                    +1 Week
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDuration(14)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer text-center"
                  >
                    +2 Weeks
                  </button>
                </div>
              </div>

              {/* Exact Date Picker */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Follow-Up Due Date *
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="input text-sm"
                />
              </div>

              {/* Follow-Up Notes */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Follow-Up Notes / Next Steps
                </label>
                <textarea
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  rows={3}
                  className="input text-xs resize-none"
                  placeholder="e.g. Sent price quote, following up on revised structural addendum and contractor sign-off..."
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFollowUpModalProject(null)}
                className="btn-secondary flex-1 py-2.5 text-xs text-center cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingFollowUp || !followUpDate}
                onClick={handleSaveFollowUp}
                className="btn-primary flex-1 py-2.5 text-xs font-bold text-center cursor-pointer"
              >
                {savingFollowUp ? 'Saving...' : 'Set Follow-Up ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
