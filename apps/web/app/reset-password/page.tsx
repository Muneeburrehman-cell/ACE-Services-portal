'use client';
import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const form = useForm();

  async function onRequest(data: any) {
    setError('');
    try { await api.post('/auth/forgot-password', { email: data.email }); setDone(true); }
    catch (e: any) { setError(e.message); }
  }

  async function onReset(data: any) {
    if (data.newPassword !== data.confirm) { setError('Passwords do not match'); return; }
    setError('');
    try {
      await api.post('/auth/reset-password', { token, newPassword: data.newPassword });
      router.push('/login?reset=1');
    } catch (e: any) { setError(e.message); }
  }

  return (
    <div className="min-h-screen bg-construction flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center">
              <svg className="w-6 h-6 text-zinc-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.5 2 5.5 4 4.2 7H4a2 2 0 00-2 2v1a1 1 0 001 1h1v1a1 1 0 001 1h14a1 1 0 001-1v-1h1a1 1 0 001-1V9a2 2 0 00-2-2h-.2C19.5 4 16.5 2 12 2z"/>
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-white">ESTIMATION PORTAL</h1>
          </div>
        </div>

        <div className="glass-card p-8 animate-scale-in">
          <h2 className="font-display text-xl font-bold text-white mb-6">
            {token ? 'Set New Password' : 'Reset Password'}
          </h2>
          {done ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-zinc-300 text-sm">Check your email for a reset link.</p>
            </div>
          ) : token ? (
            <form onSubmit={form.handleSubmit(onReset)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">New Password</label>
                <input {...form.register('newPassword')} type="password" className="input" placeholder="Min 8 characters" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">Confirm Password</label>
                <input {...form.register('confirm')} type="password" className="input" placeholder="Repeat password" />
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3"><p className="text-red-400 text-sm">{error}</p></div>}
              <button type="submit" className="btn-primary w-full">Set Password</button>
            </form>
          ) : (
            <form onSubmit={form.handleSubmit(onRequest)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">Email Address</label>
                <input {...form.register('email')} type="email" className="input" placeholder="you@company.com" />
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3"><p className="text-red-400 text-sm">{error}</p></div>}
              <button type="submit" className="btn-primary w-full">Send Reset Link</button>
              <a href="/login" className="block text-center text-xs text-zinc-500 hover:text-yellow-400 transition-colors">← Back to login</a>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
