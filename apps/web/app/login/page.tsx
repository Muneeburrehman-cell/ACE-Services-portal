'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { login, getRoleDashboard } from '@/lib/auth';

// Dynamic import with ssr:false fixes hydration mismatch (canvas element can't render server-side)
const Construction3DCanvas = dynamic(
  () => import('@/components/ui/Construction3DCanvas').then(m => m.Construction3DCanvas),
  { ssr: false, loading: () => null }
);

// ── Role definitions ────────────────────────────────────────────────────────
const roles = [
  {
    id: 'BD_AGENT',
    label: 'Business Development',
    desc: 'Submit and track client projects',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    color: 'from-blue-600 to-blue-800',
    border: 'border-blue-500/40 hover:border-blue-400',
    glow: 'hover:shadow-blue-500/25',
  },
  {
    id: 'ESTIMATION_ENGINEER',
    label: 'Estimation Engineer',
    desc: 'Review drawings & produce takeoffs',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    color: 'from-orange-600 to-orange-800',
    border: 'border-orange-500/40 hover:border-orange-400',
    glow: 'hover:shadow-orange-500/25',
  },
  {
    id: 'DESIGN_ENGINEER',
    label: 'Design & Drafting',
    desc: 'Draft architectural CAD plans',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
    color: 'from-emerald-600 to-emerald-800',
    border: 'border-emerald-500/40 hover:border-emerald-400',
    glow: 'hover:shadow-emerald-500/25',
  },
  {
    id: 'ADMIN',
    label: 'Administrator',
    desc: 'Pipeline control & client dispatch',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: 'from-yellow-500 to-amber-600',
    border: 'border-yellow-500/40 hover:border-yellow-400',
    glow: 'hover:shadow-yellow-500/25',
  },
];

const schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Min 6 characters'),
});

// ── Suspenseful Cinematic Login Hologram Overlay ──────────────────────────
function SuspensefulLoginSequence({
  phase,
  roleLabel,
}: {
  phase: 1 | 2 | 3;
  roleLabel: string;
}) {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (phase === 1) {
      setLogs([
        '>> [SYS-INIT] INITIATING ENCRYPTED TLS 1.3 TUNNEL...',
        '>> [BIOMETRICS] VERIFYING ROLE CREDENTIALS...',
      ]);
    } else if (phase === 2) {
      setLogs(prev => [
        ...prev,
        '>> [SECURITY] HANDSHAKE VERIFIED // ENCRYPTION KEY VALIDATED.',
        `>> [AUTH-GATE] ACCESS GRANTED: ${roleLabel.toUpperCase()}`,
        '>> [WORK-ENGINE] DECRYPTING ENTERPRISE PIPELINE...',
      ]);
    } else if (phase === 3) {
      setLogs(prev => [
        ...prev,
        '>> [WARP] LAUNCHING DESIGNATED WORKSPACE DESK...',
      ]);
    }
  }, [phase, roleLabel]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl transition-all duration-700 ${
      phase === 3 ? 'scale-110 opacity-0' : 'opacity-100'
    }`}>
      {/* Laser Scanning Line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent shadow-[0_0_20px_#eab308] animate-[scan_2s_ease-in-out_infinite]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.1)_0,transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-md w-full mx-4 p-8 glass-card border-yellow-400/40 shadow-2xl shadow-yellow-400/20 text-center animate-scale-in">
        {/* Holographic Radar Pulse */}
        <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <span className="absolute inset-0 rounded-full border border-yellow-400/40 animate-ping opacity-75" />
          <span className="absolute inset-2 rounded-full border border-yellow-400/60 animate-pulse" />
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-zinc-950 font-bold shadow-xl shadow-yellow-400/40">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
        </div>

        {/* Status Stamp */}
        <p className="text-[11px] font-mono font-bold tracking-widest text-yellow-400 uppercase bg-yellow-400/10 border border-yellow-400/30 px-3 py-1 rounded-full inline-block mb-3 animate-pulse">
          {phase === 1 ? 'SECURITY CLEARANCE IN PROGRESS' : 'ACCESS GRANTED'}
        </p>

        <h3 className="font-display text-2xl font-bold text-white mb-2">
          {phase === 1 ? 'Authenticating...' : 'Entering Workspace'}
        </h3>
        <p className="text-zinc-400 text-xs font-mono">{roleLabel}</p>

        {/* Telemetry Console Readout */}
        <div className="mt-5 text-left bg-zinc-950/90 border border-zinc-800 rounded-xl p-3.5 space-y-1 font-mono text-[11px] h-28 overflow-hidden flex flex-col justify-end">
          {logs.map((log, i) => (
            <p key={i} className={log.includes('GRANTED') ? 'text-emerald-400 font-bold' : 'text-zinc-400 animate-fade-in'}>
              {log}
            </p>
          ))}
          <div className="w-2 h-3.5 bg-yellow-400 inline-block animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'role' | 'credentials'>('role');
  const [selectedRole, setSelectedRole] = useState<typeof roles[0] | null>(null);
  const [error, setError] = useState('');
  const [fading, setFading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Suspense transition state
  const [suspensePhase, setSuspensePhase] = useState<0 | 1 | 2 | 3>(0);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  function transition(fn: () => void) {
    setFading(true);
    setTimeout(() => { fn(); setFading(false); }, 220);
  }

  function pickRole(role: typeof roles[0]) {
    form.reset({ email: '', password: '' });
    setShowPassword(false);
    transition(() => { setSelectedRole(role); setStep('credentials'); setError(''); });
  }

  function goBack() {
    transition(() => {
      setStep('role');
      setSelectedRole(null);
      setError('');
      form.reset({ email: '', password: '' });
      setShowPassword(false);
    });
  }

  async function onSubmit(data: any) {
    setError('');
    // Trigger Phase 1: Security Scan
    setSuspensePhase(1);

    try {
      const res = await login(data.email, data.password);
      form.reset({ email: '', password: '' });

      // Trigger Phase 2: Authorization Burst
      setTimeout(() => {
        setSuspensePhase(2);
      }, 700);

      // Trigger Phase 3: 3D Warp & Transition
      setTimeout(() => {
        setSuspensePhase(3);
      }, 1600);

      // Redirect into workspace
      setTimeout(() => {
        router.push(getRoleDashboard(res.role));
      }, 2100);
    } catch (e: any) {
      setSuspensePhase(0);
      setError(e.message || 'Authentication failed. Please check credentials.');
    }
  }

  const opacity = fading ? 'opacity-0 scale-95' : 'opacity-100 scale-100';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-zinc-950">
      {/* High-Resolution Construction Hero Wallpaper */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-25 scale-105 pointer-events-none"
        style={{ backgroundImage: `url('/backgrounds/bg-login.jpg')` }}
      />
      {/* Interactive 3D Construction Isometric Wireframe Canvas */}
      <Construction3DCanvas />

      {/* Ambient background depth grid */}
      <div className="fixed inset-0 bg-construction opacity-40 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-tr from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none" />

      {/* Suspenseful Cinematic Login Overlay */}
      {suspensePhase > 0 && selectedRole && (
        <SuspensefulLoginSequence phase={suspensePhase as 1 | 2 | 3} roleLabel={selectedRole.label} />
      )}

      <div className="relative z-10 w-full max-w-lg">
        {/* Brand */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-4 mb-2">
            {/* ACE Services Logo */}
            <div className="relative w-16 h-16 flex-shrink-0 drop-shadow-[0_0_16px_rgba(251,146,60,0.5)]">
              <Image
                src="/ace-logo.png"
                alt="ACE Services Logo"
                width={64}
                height={64}
                className="object-contain"
                priority
              />
            </div>
            <div className="text-left">
              <h1 className="font-display text-2xl font-bold tracking-widest leading-none">
                <span className="text-orange-400">ACE</span>
                <span className="text-white"> SERVICES</span>
              </h1>
              <p className="text-[11px] text-zinc-400 uppercase tracking-widest font-mono mt-1">Construction Estimation Portal</p>
            </div>
          </div>
        </div>

        {/* ── Step 1: Role Selection ── */}
        {step === 'role' && (
          <div className={`transition-all duration-200 ${opacity}`}>
            <div className="glass-card p-7 shadow-2xl border-zinc-800 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-800">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Select Access Desk</p>
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {roles.map((role, i) => (
                  <button
                    key={role.id}
                    onClick={() => pickRole(role)}
                    title={`Role: ${role.label} — ${role.desc}`}
                    className={`relative p-4 rounded-xl border bg-zinc-900/80 ${role.border}
                      hover:bg-zinc-800/90 hover:scale-[1.02] active:scale-[0.98] ${role.glow}
                      transition-all duration-200 text-left group cursor-pointer flex flex-col justify-between`}
                    style={{ animation: `fadeInUp 0.35s ease-out ${i * 50}ms both` }}
                  >
                    <div>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.color}
                        flex items-center justify-center mb-3 text-white
                        group-hover:scale-110 transition-transform duration-200 shadow-md`}>
                        {role.icon}
                      </div>
                      <p className="font-semibold text-zinc-100 text-sm leading-tight group-hover:text-yellow-300 transition-colors">
                        {role.label}
                      </p>
                    </div>

                    {/* Description shows ONLY on hover / mouse arrow hover */}
                    <div className="max-h-0 opacity-0 group-hover:max-h-16 group-hover:opacity-100 transition-all duration-300 ease-out overflow-hidden">
                      <p className="text-yellow-300/90 text-[11px] mt-2 leading-snug font-medium border-t border-zinc-800/80 pt-1.5">
                        💡 {role.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center mt-4">
              <a 
                href="/setup" 
                title="Initialize new employee workspace account credentials"
                className="text-xs text-zinc-500 hover:text-yellow-400 transition-colors inline-flex items-center gap-1.5 font-mono group"
              >
                <span>New Employee? Setup your account credentials →</span>
              </a>
            </div>
          </div>
        )}

        {/* ── Step 2: Credentials ── */}
        {step === 'credentials' && selectedRole && (
          <div className={`transition-all duration-200 ${opacity}`}>
            <div className="glass-card p-7 shadow-2xl border-zinc-800 backdrop-blur-xl">
              {/* Role banner */}
              <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-zinc-800">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${selectedRole.color}
                  flex items-center justify-center flex-shrink-0 text-white shadow-md`}>
                  {selectedRole.icon}
                </div>
                <div>
                  <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest">Sign In As</p>
                  <p className="font-display text-lg font-bold text-white leading-tight">{selectedRole.label}</p>
                </div>
                <button
                  onClick={goBack}
                  className="ml-auto btn-ghost text-xs p-1.5 cursor-pointer hover:text-yellow-400 transition-colors"
                  title="Switch to another role"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">
                    Email Address
                  </label>
                  <input
                    {...form.register('email')}
                    type="email"
                    autoComplete="email"
                    className={`input text-sm ${form.formState.errors.email ? 'input-error' : ''}`}
                    placeholder="name@aceservices.com"
                    autoFocus
                  />
                  {form.formState.errors.email && (
                    <p className="text-red-400 text-xs mt-1">{String(form.formState.errors.email.message)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      {...form.register('password')}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className={`input text-sm pr-11 ${form.formState.errors.password ? 'input-error' : ''}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      title={showPassword ? "Hide password characters" : "Show password characters"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 transition-colors p-1 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-red-400 text-xs mt-1">{String(form.formState.errors.password.message)}</p>
                  )}
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-xs animate-fade-in">
                    {error}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    title={`Sign in as ${selectedRole.label} and launch workspace desk`}
                    className="btn-primary w-full py-3 text-xs tracking-wider uppercase font-bold animate-pulse-glow cursor-pointer"
                    disabled={form.formState.isSubmitting || suspensePhase > 0}
                  >
                    <span>Authenticate & Access Workspace</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <a href="/reset-password" className="text-xs text-zinc-500 hover:text-yellow-400 transition-colors font-mono">
                    Forgot password?
                  </a>
                  <a href="/setup" className="text-xs text-zinc-500 hover:text-yellow-400 transition-colors font-mono">
                    New employee setup →
                  </a>
                </div>
              </form>
            </div>
          </div>
        )}

        <p className="text-center text-zinc-600 text-xs mt-6 font-mono">
          © {new Date().getFullYear()} ACE SERVICES · Construction Estimation Management Portal
        </p>
      </div>
    </div>
  );
}
