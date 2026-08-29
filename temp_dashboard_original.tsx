'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { api, getAccessToken } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { DeadlineCountdown } from '@/components/ui/DeadlineCountdown';

const STATUSES = [
  { id: '',               label: 'All Active',      color: 'text-zinc-100',  bg: 'bg-zinc-800' },
  { id: 'received',       label: 'New Intake',      color: 'text-blue-400',  bg: 'bg-blue-500/10' },
  { id: 'proposal',       label: 'Proposal',        color: 'text-purple-400',bg: 'bg-purple-500/10' },
  { id: 'follow_up',      label: 'Follow-Up',       color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 'approved',       label: 'Approved',        color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 'assigned',       label: 'Assigned',        color: 'text-yellow-400',bg: 'bg-yellow-500/10' },
  { id: 'in_progress',    label: 'In Progress',     color: 'text-orange-400',bg: 'bg-orange-500/10' },
  { id: 'delivered',      label: 'Delivered Ready', color: 'text-teal-400',   bg: 'bg-teal-500/10' },
  { id: 'sent_to_client', label: 'Dispatched',      color: 'text-indigo-400',bg: 'bg-indigo-500/10' },
];

export default function AdminDashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [deptFilter, setDeptFilter] = useState<'all' | 'estimation' | 'design_drafting'>('all');
  const [engineers, setEngineers] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  // Excel Export State
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Assign Modal
  const [assigningProject, setAssigningProject] = useState<any | null>(null);
  const assignForm = useForm();
  const [assignLoading, setAssignLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  async function handleExportExcel(range: string = 'this_week') {
    setExportLoading(true);
    setShowExportMenu(false);
    try {
      const token = getAccessToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const p = new URLSearchParams();
      p.set('range', range);
      if (deptFilter !== 'all') p.set('department', deptFilter);
      if (filterStatus) p.set('status', filterStatus);

      const res = await fetch(`${apiUrl}/projects/export/weekly-excel?${p.toString()}`, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Download failed' }));
        throw new Error(err.message || 'Export failed');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const contentDisposition = res.headers.get('content-disposition');
      let filename = `ACE_Projects_Weekly_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match?.[1]) filename = match[1];
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      const rangeLabel =
        range === 'this_week' ? 'This Week' :
        range === 'last_7_days' ? 'Last 7 Days' :
        range === 'last_week' ? 'Last Week' :
        range === 'this_month' ? 'This Month' : 'All-Time';

      showToast(`${rangeLabel} Excel report downloaded successfully! ≡ƒôè`);
    } catch (err: any) {
      showToast(err.message || 'Failed to export Excel report', 'error');
    } finally {
      setExportLoading(false);
    }
  }

  const load = useCallback((s = search, fs = filterStatus) => {
    setLoading(true);
    setLoadError(false);
    const p = new URLSearchParams();
    if (s) p.set('search', s);
    if (fs) p.set('status', fs);
    api.get<any>(`/projects?${p}&limit=100`)
      .then((r) => {
        const list = Array.isArray(r) ? r : (r?.data ?? []);
        // Only update if we actually got data or the list was intentionally empty
        if (Array.isArray(list)) {
          setProjects(list);
          setTotal(r?.total ?? list.length);
          setLoadError(false);
        }
      })
      .catch((err) => {
        // On error: preserve existing projects (don't wipe them), show error banner
        console.error('[Dashboard] Failed to load projects:', err);
        setLoadError(true);
        // Do NOT clear projects ΓÇö keep the last known good state visible
      })
      .finally(() => setLoading(false));
  }, [search, filterStatus]);

  useEffect(() => {
    setMounted(true);
    load();
    const fetchAll = () => {
      api.get<any>('/projects?limit=250')
        .then(r => {
          const list = Array.isArray(r) ? r : (r?.data ?? []);
          if (Array.isArray(list)) setAllProjects(list);
        })
        .catch(() => { /* silent ΓÇö allProjects keeps last known good state */ });
    };
    fetchAll();
    api.get<any>('/users/engineers').then(setEngineers).catch(() => {});

    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    // Close export dropdown when clicking outside it
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-export-menu]')) setShowExportMenu(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    // Increased to 30s to reduce DB pressure; data still auto-refreshes
    const interval = setInterval(() => {
      load();
      fetchAll();
    }, 30000);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('mousedown', onClickOutside);
      clearInterval(interval);
    };
  }, [load]);

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  const countByStatus = (status: string) => allProjects.filter(p => p.status === status).length;

  const totalCount = allProjects.length || total;
  const receivedCount = countByStatus('received');
  const inProgressCount = countByStatus('in_progress') + countByStatus('assigned');
  const deliveredCount = countByStatus('delivered');
  const sentCount = countByStatus('sent_to_client');

  async function handleQuickAssign(data: any) {
    if (!assigningProject) return;
    setAssignLoading(true);
    try {
      const payload = {
        ...data,
        priority: data.priority || 'medium',
        projectType: assigningProject.projectType || 'estimation',
      };
      await api.patch(`/projects/${assigningProject.id}/assign`, payload);
      showToast(`Assigned ${assigningProject.referenceNumber} to engineer.`);
      setAssigningProject(null);
      load();
    } catch (err: any) {
      showToast(err.message || 'Failed to assign project', 'error');
    } finally {
      setAssignLoading(false);
    }
  }

  async function handleDeleteProject(p: any) {
    if (!confirm(`Permanently delete project ${p.referenceNumber}?\n\nThis will remove all associated files and history.`)) return;
    try {
      await api.delete(`/projects/${p.id}`);
      showToast(`Project ${p.referenceNumber} deleted.`);
      load();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete project', 'error');
    }
  }

  // Filter projects by department
  const displayedProjects = projects.filter((p) => {
    if (deptFilter !== 'all' && (p.projectType || 'estimation') !== deptFilter) {
      return false;
    }
    return true;
  });

  const stats = [
    {
      label: 'Total Volume',
      value: totalCount,
      sub: 'All registered projects',
      color: 'text-zinc-100',
      border: 'border-zinc-700/80',
      glow: 'shadow-zinc-500/5',
      icon: (
        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
    },
    {
      label: 'New & Unassigned',
      value: receivedCount,
      sub: 'Action required by Admin',
      color: 'text-blue-400',
      border: 'border-blue-500/30',
      glow: 'shadow-blue-500/10',
      icon: (
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'In Production',
      value: inProgressCount,
      sub: 'With Engineers / Drafters',
      color: 'text-orange-400',
      border: 'border-orange-500/30',
      glow: 'shadow-orange-500/10',
      icon: (
        <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.67 2.67 0 0021 17.25l-5.87-5.83m0 0a8.97 8.97 0 01-1.39 1.39l5.87 5.83M12 4.5v15m7.5-7.5h-15" />
        </svg>
      ),
    },
    {
      label: 'Delivered Ready',
      value: deliveredCount,
      sub: 'Awaiting client email dispatch',
      color: 'text-teal-400',
      border: 'border-teal-500/30',
      glow: 'shadow-teal-500/10',
      icon: (
        <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-7">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-yellow-400 font-semibold">Admin Command</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">Production Pipeline</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {totalCount} project{totalCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* 1-Click Weekly Excel Export Button Group */}
          <div className="relative inline-flex rounded-xl shadow-lg shadow-emerald-950/20" data-export-menu>
            {/* Primary 1-Click Button */}
            <button
              onClick={() => handleExportExcel('this_week')}
              disabled={exportLoading}
              className="px-3.5 py-2.5 rounded-l-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-60"
              title="1-Click Download This Week's Projects in Excel (.xlsx)"
            >
              {exportLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-zinc-950" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-zinc-950" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  <span>Download Weekly Excel</span>
                </>
              )}
            </button>

            {/* Dropdown Toggle for alternative date ranges */}
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exportLoading}
              className="px-2 py-2.5 rounded-r-xl text-xs bg-emerald-600 hover:bg-emerald-500 text-zinc-950 border-l border-emerald-700/50 flex items-center justify-center transition-all cursor-pointer"
              title="More export options (Past 7 Days, Month, All-Time)"
            >
              <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-60 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl p-1.5 z-50 animate-scale-in space-y-1">
                <p className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Select Excel Export Range
                </p>
                <button
                  onClick={() => handleExportExcel('this_week')}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-zinc-200 hover:bg-emerald-500/15 hover:text-emerald-300 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">ΓÜí This Week (Current)</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Default</span>
                </button>
                <button
                  onClick={() => handleExportExcel('last_7_days')}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-zinc-200 hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  ≡ƒôà Past 7 Days
                </button>
                <button
                  onClick={() => handleExportExcel('last_week')}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-zinc-200 hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  ΓÅ¬ Previous Full Week
                </button>
                <button
                  onClick={() => handleExportExcel('this_month')}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-zinc-200 hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  ≡ƒùô∩╕Å This Month
                </button>
                <div className="h-px bg-zinc-800 my-1" />
                <button
                  onClick={() => handleExportExcel('all')}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-amber-300 hover:bg-amber-500/15 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  ≡ƒôü All-Time Full Pipeline Archive
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => load()}
            className="btn-secondary text-xs py-2.5 px-3.5 cursor-pointer"
            title="Refresh pipeline"
          >
            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Refresh
          </button>
          <Link
            href="/admin/users"
            className="btn-secondary text-xs py-2.5 px-4 flex items-center gap-2"
          >
            Manage Users
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div
            key={i}
            className={`glass-card p-5 border ${s.border} shadow-lg ${s.glow} relative overflow-hidden group hover:scale-[1.01] transition-transform duration-200`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{s.label}</p>
                <p className={`font-display text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                <p className="text-[11px] text-zinc-400 mt-1">{s.sub}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60">
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ΓöÇΓöÇ Filters & Department Selection ΓöÇΓöÇ */}
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
              All Pipeline ({projects.length})
            </button>
            <button
              onClick={() => setDeptFilter('estimation')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                deptFilter === 'estimation'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              ≡ƒôÉ Estimation ({projects.filter(p => (p.projectType || 'estimation') === 'estimation').length})
            </button>
            <button
              onClick={() => setDeptFilter('design_drafting')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                deptFilter === 'design_drafting'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              ≡ƒÅ¢∩╕Å Design & Drafting ({projects.filter(p => p.projectType === 'design_drafting').length})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <input
              type="text"
              placeholder="Search reference, company, salesperson..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                load(e.target.value, filterStatus);
              }}
              className="input text-xs py-1.5 pl-8 bg-zinc-900 border-zinc-700"
            />
            <svg className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-zinc-800/80">
          {STATUSES.map((st) => (
            <button
              key={st.id}
              onClick={() => {
                setFilterStatus(st.id);
                load(search, st.id);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === st.id
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
              }`}
            >
              {st.label} {st.id && `(${allProjects.filter(p => p.status === st.id).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Table */}
      {/* DB connection error banner ΓÇö shown without hiding existing data */}
      {loadError && !loading && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300 animate-fade-in">
          <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span>ΓÜá∩╕Å Could not reach the server ΓÇö showing last known data. The pipeline will auto-refresh when connectivity returns.</span>
          <button onClick={() => load()} className="ml-auto text-xs font-bold text-red-300 hover:text-red-100 border border-red-500/40 px-2.5 py-1 rounded-lg cursor-pointer transition-colors">
            Retry Now
          </button>
        </div>
      )}
      {loading && projects.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 rounded-2xl shimmer border border-zinc-800" />
          ))}
        </div>
      ) : displayedProjects.length === 0 ? (
        <div className="glass-card text-center py-16 border-dashed border-zinc-700">
          <p className="text-zinc-300 font-semibold">No projects match the selected criteria</p>
          <p className="text-zinc-500 text-xs mt-1">Adjust your search or department filter</p>
        </div>
      ) : (
        <div className="glass-card p-0 overflow-hidden border-zinc-800 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/90">
                  <th className="px-4 py-3.5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Reference</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Client & Contact</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Salesperson & Price</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Department</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Assigned Engineer</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Status / RFI</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {displayedProjects.map((p, i) => {
                  const isEstimation = (p.projectType || 'estimation') === 'estimation';
                  const pendingRfis = p.rfis?.filter((r: any) => r.status === 'pending') || [];

                  return (
                    <tr
                      key={p.id}
                      className="table-row-hover group"
                      style={{ animation: `fadeInUp 0.3s ease-out ${i * 25}ms both` }}
                    >
                      {/* Reference */}
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-yellow-400 whitespace-nowrap">
                        <Link href={`/admin/projects/${p.id}`} className="hover:underline flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                          {p.referenceNumber}
                        </Link>
                        <p className="text-[10px] text-zinc-500 font-sans mt-0.5">
                          {new Date(p.submittedAt).toLocaleDateString()}
                        </p>
                      </td>

                      {/* Client Company & Contact */}
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-zinc-100 group-hover:text-yellow-200 transition-colors text-sm leading-tight">
                          {p.clientCompanyName || p.clientName}
                        </p>
                        {p.clientContactPerson && (
                          <p className="text-xs text-zinc-400 mt-0.5">
                            <span className="text-zinc-500">Contact:</span> {p.clientContactPerson}
                          </p>
                        )}
                        <p className="text-[11px] text-zinc-500 font-mono mt-0.5 truncate max-w-xs">{p.clientEmail}</p>
                      </td>

                      {/* Salesperson & Price */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="font-mono text-xs font-bold text-emerald-400">
                            ${p.decidedPrice ? Number(p.decidedPrice).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            Sales: {p.salespersonName || 'N/A'}
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${
                          isEstimation
                            ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {isEstimation ? '≡ƒôÉ Estimation' : '≡ƒÅ¢∩╕Å Drafting'}
                        </span>
                      </td>

                      {/* Assigned Engineer */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {p.assignedEngineer ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700 text-yellow-400 flex items-center justify-center text-[10px] font-bold">
                              {p.assignedEngineer.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-zinc-200">{p.assignedEngineer.fullName}</p>
                              <p className="text-[10px] text-zinc-500">{p.assignedEngineer.role?.replace(/_/g, ' ')}</p>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setAssigningProject(p);
                              const defaultDeadline = p.requestedDeadline
                                ? p.requestedDeadline.split('T')[0]
                                : new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
                              assignForm.reset({
                                engineerId: '',
                                internalDeadline: defaultDeadline,
                                priority: 'medium',
                                adminInstructions: '',
                              });
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-yellow-400/15 text-yellow-300 hover:bg-yellow-400/25 border border-yellow-400/30 cursor-pointer"
                          >
                            + Assign Engineer
                          </button>
                        )}
                      </td>

                      {/* Status / RFI Badge */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="space-y-1">
                          <StatusBadge status={p.status} />
                          {pendingRfis.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
                              Γ¥ô {pendingRfis.length} RFI Question
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/projects/${p.id}`}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                          >
                            Manage Desk ΓåÆ
                          </Link>
                          <button
                            onClick={() => handleDeleteProject(p)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Delete Project"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
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

      {/* ΓöÇΓöÇ Assign Project Modal ΓöÇΓöÇ */}
      {assigningProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card max-w-lg w-full p-6 space-y-5 border-zinc-700 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <p className="text-xs font-mono text-yellow-400 font-semibold">{assigningProject.referenceNumber}</p>
                <h3 className="text-base font-bold text-white mt-0.5">Assign to Engineer</h3>
              </div>
              <button
                onClick={() => setAssigningProject(null)}
                className="text-zinc-500 hover:text-white text-lg p-1 cursor-pointer"
              >
                Γ£ò
              </button>
            </div>

            <form onSubmit={assignForm.handleSubmit(handleQuickAssign)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Select Engineer *
                </label>
                <select
                  {...assignForm.register('engineerId', { required: true })}
                  className="input text-sm"
                >
                  <option value="">-- Choose Engineer --</option>
                  {engineers.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} ({e.role.replace(/_/g, ' ')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                    Internal Deadline *
                  </label>
                  <input
                    type="date"
                    {...assignForm.register('internalDeadline', { required: true })}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                    Priority Level *
                  </label>
                  <select {...assignForm.register('priority')} className="input text-sm">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Admin Instructions for Engineer
                </label>
                <textarea
                  {...assignForm.register('adminInstructions')}
                  rows={3}
                  className="input text-xs resize-none"
                  placeholder="Special trade instructions, specific sheet numbers to takeoff..."
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningProject(null)}
                  className="btn-secondary flex-1 py-2.5 text-xs text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading}
                  className="btn-primary flex-1 py-2.5 text-xs font-bold text-center cursor-pointer"
                >
                  {assignLoading ? 'Assigning...' : 'Confirm Assignment Γ£ô'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
