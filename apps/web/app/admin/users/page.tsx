'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';

const ROLES = [
  'BD_AGENT',
  'ESTIMATION_ENGINEER',
  'DESIGN_ENGINEER',
];

const roleColors: Record<string, string> = {
  ADMIN:                'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  BD_AGENT:             'text-blue-400 bg-blue-400/10 border-blue-400/30',
  ESTIMATION_ENGINEER:  'text-orange-400 bg-orange-400/10 border-orange-400/30',
  DESIGN_ENGINEER:      'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [error, setError] = useState('');
  const form = useForm();

  function load() {
    api.get<any>('/users').then(r => setUsers(r.data ?? [])).catch(() => {});
  }
  useEffect(load, []);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 4000);
  }

  async function onCreate(data: any) {
    setError('');
    try {
      await api.post('/users', data);
      load();
      setShowCreate(false);
      form.reset();
      showToast('User created successfully — invitation setup email sent');
    } catch (e: any) {
      setError(e.message || 'Failed to create user');
    }
  }

  async function deactivate(id: string, name: string) {
    if (!confirm(`Deactivate ${name}? They will be logged out immediately.`)) return;
    await api.delete(`/users/${id}/deactivate`).catch(() => {});
    load();
    showToast('Account deactivated');
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`PERMANENTLY DELETE ${name}?\n\nThis cannot be undone. All their data will be removed.`)) return;
    try {
      await api.delete(`/users/${id}`);
      load();
      showToast(`${name} permanently deleted`);
    } catch (e: any) {
      showToast(e.message || 'Failed to delete user', 'error');
    }
  }

  async function resetPassword(id: string) {
    await api.post(`/users/${id}/reset-password`).catch(() => {});
    showToast('Password reset email sent');
  }

  return (
    <div className="space-y-7">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-xl animate-scale-in border flex items-center gap-2 backdrop-blur-xl ${
          toastType === 'success' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200' : 'bg-red-500/20 border-red-500/40 text-red-200'
        }`}>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-semibold">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-yellow-400 font-semibold">User Administration</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">Staff & Roles</h1>
          <p className="text-zinc-400 text-sm mt-1">{users.length} active registered employee accounts</p>
        </div>

        <button onClick={() => setShowCreate(true)} className="btn-primary text-xs py-2.5 px-5 self-start sm:self-auto">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add New Employee
        </button>
      </div>

      {/* Users Table */}
      <div className="glass-card p-0 overflow-hidden border-zinc-800 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/90">
                <th className="px-5 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Name</th>
                <th className="px-5 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Role</th>
                <th className="px-5 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                <th className="px-5 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {users.map((u, i) => (
                <tr
                  key={u.id}
                  className={`table-row-hover group ${!u.isActive ? 'opacity-40' : ''}`}
                  style={{ animation: `fadeInUp 0.3s ease-out ${i * 30}ms both` }}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-700 border border-zinc-600/60 flex items-center justify-center font-bold text-xs text-yellow-400 shadow-sm">
                        {(u.fullName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-100 group-hover:text-yellow-200 transition-colors">{u.fullName}</p>
                        <p className="text-zinc-400 text-xs font-mono">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${roleColors[u.role] ?? 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                      {u.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border w-fit ${
                        u.isActive ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-red-400 bg-red-500/10 border-red-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {u.pendingSetup && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border w-fit text-amber-400 bg-amber-500/10 border-amber-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          Setup Pending
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => resetPassword(u.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-yellow-400 hover:bg-yellow-400/10 border border-transparent hover:border-yellow-400/30 transition-all"
                      >
                        Reset PW
                      </button>
                      {u.isActive && u.role !== 'ADMIN' && (
                        <button
                          onClick={() => deactivate(u.id, u.fullName)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
                        >
                          Deactivate
                        </button>
                      )}
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => deleteUser(u.id, u.fullName)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-400 hover:text-white hover:bg-red-600/80 transition-all"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card max-w-md w-full p-6 animate-scale-in border-zinc-700 shadow-2xl">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-800">
              <h3 className="font-display text-xl font-bold text-white">New User</h3>
              <button onClick={() => { setShowCreate(false); setError(''); }} className="btn-ghost p-1">✕</button>
            </div>
            <form onSubmit={form.handleSubmit(onCreate)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">Full Name *</label>
                <input {...form.register('fullName', { required: true })} className="input" placeholder="e.g. Sarah Connor" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">Company Email *</label>
                <input {...form.register('email', { required: true })} type="email" className="input" placeholder="sarah@aceservices.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">Role *</label>
                <select {...form.register('role', { required: true })} className="input">
                  <option value="">Select organizational role…</option>
                  {ROLES.map(r => (
                    <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              {error && <p className="text-red-400 text-xs bg-red-500/10 p-3 rounded-xl">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Creating…' : 'Create & Invite'}
                </button>
                <button type="button" onClick={() => { setShowCreate(false); setError(''); }} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
