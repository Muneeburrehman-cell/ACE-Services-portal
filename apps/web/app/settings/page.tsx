'use client';
import { useState, useEffect } from 'react';
import { api, getUserRole } from '@/lib/api';
import { logout } from '@/lib/auth';

interface Toast { message: string; type: 'success' | 'error'; }

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  // Name form
  const [newName, setNewName] = useState('');
  const [nameLoading, setNameLoading] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    const role = getUserRole() ?? '';
    const name = typeof window !== 'undefined' ? sessionStorage.getItem('user_name') ?? '' : '';
    const email = typeof window !== 'undefined' ? sessionStorage.getItem('user_email') ?? '' : '';
    setUser({ role, fullName: name, email });
    setNewName(name);
  }, []);

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setNameLoading(true);
    try {
      const updated = await api.patch<any>('/users/profile', { fullName: newName.trim() });
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('user_name', updated.fullName ?? newName.trim());
      }
      setUser((u: any) => ({ ...u, fullName: updated.fullName ?? newName.trim() }));
      showToast('Display name updated successfully');
    } catch (err: any) {
      showToast(err.message || 'Failed to update name', 'error');
    } finally {
      setNameLoading(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    setPwLoading(true);
    try {
      await api.patch('/users/profile', { currentPassword, newPassword });
      showToast('Security password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'Failed to change password', 'error');
    } finally {
      setPwLoading(false);
    }
  }

  const roleLabels: Record<string, string> = {
    BD_AGENT: 'Business Development Agent',
    ESTIMATION_ENGINEER: 'Estimation Engineer',
    DESIGN_ENGINEER: 'Design & Drafting Engineer',
    ADMIN: 'System Administrator',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-7">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3.5 rounded-2xl shadow-xl animate-scale-in border flex items-center gap-2 backdrop-blur-xl ${
          toast.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200' : 'bg-red-500/20 border-red-500/40 text-red-200'
        }`}>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-widest text-yellow-400 font-semibold">User Preferences</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">Account & Security</h1>
        <p className="text-zinc-400 text-sm mt-1">Manage profile credentials, session access, and password</p>
      </div>

      {/* User Profile Card */}
      {user && (
        <div className="glass-card p-6 border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-amber-500/20 border border-yellow-400/30 flex items-center justify-center flex-shrink-0 text-xl font-bold text-yellow-400 shadow-lg shadow-yellow-400/10">
              {(user.fullName || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-white leading-tight">{user.fullName || 'User Profile'}</h2>
              <p className="text-zinc-400 text-xs font-mono mt-0.5">{user.email || 'portal-account'}</p>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-yellow-400 border border-zinc-700">
                {roleLabels[user.role] ?? user.role}
              </span>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="btn-signout self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Sign Out Now
          </button>
        </div>
      )}

      {/* Display Name Section */}
      <div className="glass-card p-6 border-zinc-800 space-y-4">
        <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
          </svg>
          Display Name
        </h3>

        <form onSubmit={saveName} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">
              Full Legal Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="input text-sm"
              placeholder="Your full name"
              required
            />
          </div>
          <button type="submit" className="btn-primary text-xs py-2 px-5" disabled={nameLoading}>
            {nameLoading ? 'Saving...' : 'Update Name'}
          </button>
        </form>
      </div>

      {/* Change Password Section */}
      <div className="glass-card p-6 border-zinc-800 space-y-4">
        <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          Change Password
        </h3>

        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">
              Current Password *
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="input text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">
                New Password *
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="input text-sm"
                placeholder="Min. 8 characters"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">
                Confirm New Password *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className={`input text-sm ${confirmPassword && confirmPassword !== newPassword ? 'input-error' : ''}`}
                placeholder="Re-enter new password"
                required
              />
            </div>
          </div>

          {confirmPassword && confirmPassword !== newPassword && (
            <p className="text-red-400 text-xs">Passwords do not match</p>
          )}

          <button type="submit" className="btn-primary text-xs py-2 px-5" disabled={pwLoading}>
            {pwLoading ? 'Updating Password...' : 'Save New Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
