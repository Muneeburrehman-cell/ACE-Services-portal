'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { login, getRoleDashboard } from '@/lib/auth';

// Dynamic import with ssr:false fixes hydration mismatch
const Construction3DCanvas = dynamic(
  () => import('@/components/ui/Construction3DCanvas').then(m => m.Construction3DCanvas),
  { ssr: false, loading: () => null }
);

const schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Min 6 characters'),
});

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(data: any) {
    setError('');
    setIsLoading(true);
    
    try {
      const res = await login(data.email, data.password);
      form.reset({ email: '', password: '' });
      
      // Immediate redirect - no delay
      router.push(getRoleDashboard(res.role));
    } catch (e: any) {
      setIsLoading(false);
      setError(e.message || 'Authentication failed. Please check credentials.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-zinc-950">
      {/* Background */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-25 scale-105 pointer-events-none"
        style={{ backgroundImage: `url('/backgrounds/bg-login.jpg')` }}
      />
      <Construction3DCanvas />
      <div className="fixed inset-0 bg-construction opacity-40 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-tr from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Brand */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-4 mb-2">
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

        {/* Login Form - Step 2 & 3 Combined */}
        <div className="animate-fade-in-up">
          <div className="glass-card p-7 shadow-2xl border-zinc-800 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-800">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Sign In</p>
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
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
                  disabled={isLoading}
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
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    title={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 transition-colors p-1 cursor-pointer"
                    tabIndex={-1}
                    disabled={isLoading}
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
                  className="btn-primary w-full py-3 text-xs tracking-wider uppercase font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={form.formState.isSubmitting || isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Sign In
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </span>
                  )}
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

        <p className="text-center text-zinc-600 text-xs mt-6 font-mono">
          © {new Date().getFullYear()} ACE SERVICES · Construction Estimation Management Portal
        </p>
      </div>
    </div>
  );
}
