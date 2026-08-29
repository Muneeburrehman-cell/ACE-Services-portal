'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function checkEmail(email: string) {
  const res = await fetch(`${API_URL}/auth/check-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error('Failed to check email');
  return res.json();
}

async function completeSetup(email: string, newPassword: string) {
  const res = await fetch(`${API_URL}/auth/complete-setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Setup failed');
  return data;
}

function ConstructionBg() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-construction opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-950/90 to-zinc-900/80" />
      <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-yellow-400/5 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-orange-600/5 blur-3xl" />
      <div className="absolute top-0 left-0 right-0 h-1 stripe-yellow opacity-60" />
    </div>
  );
}

function SetupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<'email' | 'password' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      const cleanEmail = emailParam.trim().toLowerCase();
      setEmail(cleanEmail);
      setLoading(true);
      checkEmail(cleanEmail)
        .then((result) => {
          if (result.exists) {
            setUserName(result.fullName);
            setStep('password');
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [searchParams]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email address'); return; }
    setLoading(true);
    try {
      const result = await checkEmail(email.trim().toLowerCase());
      if (!result.exists) {
        setError('No pending setup found for that email. Contact your administrator.');
      } else {
        setUserName(result.fullName);
        setStep('password');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await completeSetup(email, password);
      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative z-10 w-full max-w-md">
      {/* Brand */}
      <div className="text-center mb-8 animate-fade-in-up">
        <div className="inline-flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-yellow-400 flex items-center justify-center shadow-xl shadow-yellow-400/30">
            <svg className="w-7 h-7 text-zinc-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.5 2 5.5 4 4.2 7H4a2 2 0 00-2 2v1a1 1 0 001 1h1v1a1 1 0 001 1h14a1 1 0 001-1v-1h1a1 1 0 001-1V9a2 2 0 00-2-2h-.2C19.5 4 16.5 2 12 2z"/>
            </svg>
          </div>
          <div className="text-left">
            <h1 className="font-display text-2xl font-bold text-white tracking-widest leading-none">ACE SERVICES</h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">New Employee Setup</p>
          </div>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-3 mb-6">
        {['email', 'password', 'done'].map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
              ${step === s
                ? 'bg-yellow-400 text-zinc-900 shadow-lg shadow-yellow-400/30'
                : ['done', 'password'].includes(step) && i < ['email','password','done'].indexOf(step)
                  ? 'bg-green-500 text-white'
                  : 'bg-zinc-700 text-zinc-500'
              }`}>
              {['done', 'password'].includes(step) && i < ['email','password','done'].indexOf(step)
                ? '✓' : i + 1}
            </div>
            {i < 2 && <div className={`w-8 h-0.5 ${i < ['email','password','done'].indexOf(step) ? 'bg-green-500' : 'bg-zinc-700'}`} />}
          </div>
        ))}
      </div>

      <div className="glass-card p-8 animate-fade-in-up">
        {/* ── Step 1: Email ── */}
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div>
              <h2 className="font-display text-xl font-bold text-white mb-1">Verify Your Email</h2>
              <p className="text-zinc-400 text-sm">Enter the work email address your administrator assigned to your account.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">
                Work Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="you@company.com"
                autoFocus
                required
              />
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>Checking…</>
              ) : 'Continue →'}
            </button>
            <div className="text-center">
              <a href="/login" className="text-xs text-zinc-500 hover:text-yellow-400 transition-colors">
                ← Back to Login
              </a>
            </div>
          </form>
        )}

        {/* ── Step 2: Set Password ── */}
        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <h2 className="font-display text-xl font-bold text-white mb-1">Set Your Password</h2>
              <p className="text-zinc-300 text-sm">
                Welcome, <span className="text-yellow-400 font-semibold">{userName}</span>! Choose a strong password to secure your account.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input"
                placeholder="Min. 8 characters"
                autoFocus
                required
              />
              {password && (
                <div className="mt-2 flex gap-1">
                  {[...Array(4)].map((_, i) => {
                    const strength = password.length >= 8 ? 1 : 0;
                    const hasUpper = /[A-Z]/.test(password) ? 1 : 0;
                    const hasNum = /\d/.test(password) ? 1 : 0;
                    const hasSpecial = /[^a-zA-Z0-9]/.test(password) ? 1 : 0;
                    const total = strength + hasUpper + hasNum + hasSpecial;
                    return (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        i < total
                          ? total <= 1 ? 'bg-red-500' : total <= 2 ? 'bg-yellow-500' : total <= 3 ? 'bg-blue-500' : 'bg-green-500'
                          : 'bg-zinc-700'
                      }`} />
                    );
                  })}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className={`input ${confirmPassword && confirmPassword !== password ? 'input-error' : ''}`}
                placeholder="Re-enter your password"
                required
              />
              {confirmPassword && confirmPassword !== password && (
                <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
              )}
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => { setStep('email'); setError(''); }} className="btn-secondary">
                ← Back
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={loading}>
                {loading ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>Setting up…</>
                ) : 'Complete Setup →'}
              </button>
            </div>
          </form>
        )}

        {/* ── Step 3: Success ── */}
        {step === 'done' && (
          <div className="text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-white mb-1">Account Activated!</h2>
              <p className="text-zinc-400 text-sm">Your password has been configured successfully. You can now sign in to your workspace.</p>
            </div>
            <button onClick={() => router.push('/login')} className="btn-primary w-full">
              Go to Login →
            </button>
          </div>
        )}
      </div>

      <p className="text-center text-zinc-600 text-xs mt-6" suppressHydrationWarning>© {new Date().getFullYear()} ACE SERVICES · Construction Estimation Portal
      </p>
    </div>
  );
}

export default function SetupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <ConstructionBg />
      <Suspense fallback={
        <div className="relative z-10 w-full max-w-md glass-card p-8 text-center text-zinc-400">
          <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading invitation details…</p>
        </div>
      }>
        <SetupForm />
      </Suspense>
    </div>
  );
}


