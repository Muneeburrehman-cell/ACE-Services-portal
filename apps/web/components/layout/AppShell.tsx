'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { logout } from '@/lib/auth';
import { getUserRole } from '@/lib/api';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

const navByRole: Record<string, NavItem[]> = {
  BD_AGENT: [
    { href: '/bd/dashboard', label: 'My Submissions', icon: <IconFolder /> },
    { href: '/bd/submit',    label: 'New Project',    icon: <IconPlus /> },
    { href: '/settings',     label: 'Settings',       icon: <IconCog /> },
  ],
  ESTIMATION_ENGINEER: [
    { href: '/engineer/dashboard', label: 'My Work Queue', icon: <IconClipboard /> },
    { href: '/settings',           label: 'Settings',      icon: <IconCog /> },
  ],
  DESIGN_ENGINEER: [
    { href: '/engineer/dashboard', label: 'Drafting Queue', icon: <IconClipboard /> },
    { href: '/settings',           label: 'Settings',       icon: <IconCog /> },
  ],
  ADMIN: [
    { href: '/admin/dashboard', label: 'Pipeline Control', icon: <IconGrid /> },
    { href: '/admin/users',     label: 'Team & Accounts',  icon: <IconUsers /> },
    { href: '/admin/audit',     label: 'Security Audit',   icon: <IconShield /> },
    { href: '/settings',        label: 'Settings',         icon: <IconCog /> },
  ],
};

const roleColors: Record<string, { bg: string; text: string; ring: string; border: string }> = {
  BD_AGENT:             { bg: 'bg-blue-500/15', text: 'text-blue-400', ring: 'ring-blue-500/30', border: 'border-blue-500/40' },
  ESTIMATION_ENGINEER:  { bg: 'bg-orange-500/15', text: 'text-orange-400', ring: 'ring-orange-500/30', border: 'border-orange-500/40' },
  DESIGN_ENGINEER:      { bg: 'bg-emerald-500/15', text: 'text-emerald-400', ring: 'ring-emerald-500/30', border: 'border-emerald-500/40' },
  ADMIN:                { bg: 'bg-yellow-400/15', text: 'text-yellow-400', ring: 'ring-yellow-400/30', border: 'border-yellow-400/40' },
};

const roleLabels: Record<string, string> = {
  BD_AGENT:             'Business Dev',
  ESTIMATION_ENGINEER:  'Estimation Eng.',
  DESIGN_ENGINEER:      'Design & Drafting',
  ADMIN:                'Administrator',
};

export function AppShell({ role: propRole, children }: { role: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [showSignoutModal, setShowSignoutModal] = useState(false);

  const [resolvedRole, setResolvedRole] = useState(propRole === 'auto' ? '' : propRole);

  useEffect(() => {
    setMounted(true);
    if (propRole === 'auto') {
      const r = getUserRole() ?? '';
      setResolvedRole(r);
    }
    if (typeof window !== 'undefined') {
      const name = sessionStorage.getItem('user_name') ?? '';
      const email = sessionStorage.getItem('user_email') ?? '';
      setUserName(name);
      setUserEmail(email);
    }
  }, [propRole]);

  const role = resolvedRole;
  const nav = navByRole[role] ?? [];
  const roleStyle = roleColors[role] ?? { bg: 'bg-zinc-800', text: 'text-zinc-400', ring: 'ring-zinc-700', border: 'border-zinc-700' };

  const handleSignOut = () => {
    logout();
  };

  const getPageTitle = () => {
    if (pathname.includes('/admin/dashboard')) return { title: 'Pipeline Overview', section: 'Admin' };
    if (pathname.includes('/admin/users')) return { title: 'User Management', section: 'Admin' };
    if (pathname.includes('/admin/audit')) return { title: 'Security Audit Log', section: 'Admin' };
    if (pathname.includes('/bd/dashboard')) return { title: 'My Client Submissions', section: 'BD Workspace' };
    if (pathname.includes('/bd/submit')) return { title: 'Submit New Project', section: 'BD Workspace' };
    if (pathname.includes('/engineer/dashboard')) return { title: 'Production Work Queue', section: 'Engineering' };
    if (pathname.includes('/settings')) return { title: 'Account Settings', section: 'Preferences' };
    return { title: 'Estimation Portal', section: 'Dashboard' };
  };

  const pageInfo = getPageTitle();

  const getBackgroundImage = () => {
    if (pathname.includes('/admin')) return '/backgrounds/bg-admin.jpg';
    if (pathname.includes('/bd')) return '/backgrounds/bg-bd.jpg';
    if (pathname.includes('/engineer')) return '/backgrounds/bg-engineer.jpg';
    return '/backgrounds/bg-login.jpg';
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 flex font-sans selection:bg-yellow-400/30 selection:text-yellow-200 overflow-x-hidden">
      {/* ── Dynamic High-Resolution Background Wallpaper ── */}
      {/* suppressHydrationWarning: backgroundImage is client-only (pathname differs SSR vs CSR) */}
      <div 
        suppressHydrationWarning
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 opacity-20 pointer-events-none scale-[1.02]"
        style={{ backgroundImage: mounted ? `url(${getBackgroundImage()})` : undefined }}
      />
      <div className="fixed inset-0 z-0 bg-zinc-950/80 backdrop-blur-[3px] pointer-events-none" />

      {/* ── Desktop & Tablet Sidebar ── */}
      {/* suppressHydrationWarning: sidebarOpen & role classes differ between SSR initial render and client hydration */}
      <aside
        suppressHydrationWarning
        className={`
          relative z-40 bg-zinc-900/95 backdrop-blur-2xl border-r border-zinc-800/80
          flex flex-col transition-all duration-300 ease-out
          ${mounted && sidebarOpen ? 'translate-x-0 shadow-2xl shadow-black/80' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:flex
        `}
        style={{ width: '16.5rem' }}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-zinc-800/70">
          <Link href="/" className="flex items-center gap-3 group">
            {/* ACE Services Logo image */}
            <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-yellow-400/30 p-1 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-lg shadow-yellow-400/20">
              <img src="/ace-logo.png" alt="ACE Services Logo" className="w-full h-full object-contain rounded-lg" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-[15px] font-bold tracking-wider leading-none">
                <span className="text-yellow-400">ACE</span>
                <span className="text-white"> SERVICES</span>
              </p>
              <p className="text-[10px] text-zinc-500 font-medium tracking-widest mt-0.5 uppercase">Estimation Portal</p>
            </div>
          </Link>
        </div>

        {/* Current Active Role Badge */}
        <div className="px-4 py-3 bg-zinc-950/40 border-b border-zinc-800/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${roleStyle.text.replace('text-', 'bg-')} animate-pulse`} />
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}>
                {roleLabels[role] ?? role}
              </span>
            </div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400/90 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Navigation</p>
          {nav.map((item) => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`nav-link ${active ? 'nav-link-active' : ''}`}
              >
                <span className={`w-5 h-5 flex-shrink-0 transition-colors ${active ? 'text-yellow-400' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-sm shadow-yellow-400/50" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer: User Details + Bottom Sign Out */}
        <div className="border-t border-zinc-800/80 bg-zinc-950/60 p-3 space-y-2">
          {userName && (
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/50">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-yellow-400/20 to-amber-500/20 border border-yellow-400/30 flex items-center justify-center text-xs font-bold text-yellow-300">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-200 truncate">{userName}</p>
                <p className="text-[10px] text-zinc-500 truncate">{userEmail || roleLabels[role] || 'User'}</p>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowSignoutModal(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-600/90 border border-red-500/20 hover:border-red-500 transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            <IconLogout />
            Sign Out
          </button>
          
          <div className="h-1 stripe-yellow opacity-30 rounded-full" />
        </div>
      </aside>

      {/* Mobile Drawer Overlay — client-only (depends on sidebarOpen state) */}
      {mounted && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main Workspace Area ── */}
      <div className="relative z-10 flex-1 flex flex-col min-h-screen min-w-0">
        {/* Global Sticky Top Navigation Bar */}
        <header className="sticky top-0 z-30 bg-zinc-950/85 backdrop-blur-xl border-b border-zinc-800/75 px-5 py-3.5 flex items-center justify-between gap-4 transition-all">
          {/* Left: Mobile Toggle, Brand Logo & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-700/60 transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Top Navigation Brand Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-yellow-400/40 p-0.5 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-yellow-400/10">
                <img src="/ace-logo.png" alt="ACE Logo" className="w-full h-full object-contain rounded" />
              </div>
              <span className="font-display text-sm font-bold tracking-wide hidden xs:inline">
                <span className="text-yellow-400">ACE</span> <span className="text-white">SERVICES</span>
              </span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-xs ml-2 border-l border-zinc-800 pl-3">
              <span className="text-zinc-500 font-medium">{pageInfo.section}</span>
              <span className="text-zinc-700">/</span>
              <span className="text-zinc-200 font-semibold">{pageInfo.title}</span>
            </div>
          </div>

          {/* Right: Global Actions & Prominent Sign Out Button */}
          <div className="flex items-center gap-3">
            {/* Notification Center */}
            <NotificationBell />

            {/* User Profile Pill — client-only (userName from sessionStorage) */}
            {mounted && userName && (
              <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs">
                <div className="w-6 h-6 rounded-md bg-yellow-400/20 text-yellow-400 flex items-center justify-center font-bold text-[10px]">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-zinc-200 font-medium">{userName}</span>
              </div>
            )}

            {/* Quick Sign Out Header Button */}
            <button
              onClick={() => setShowSignoutModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-red-300 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/30 transition-all duration-150 cursor-pointer"
              title="Sign Out of Session"
            >
              <IconLogout />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-5 sm:p-7 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>

      {/* ── Sign Out Confirmation Modal ── */}
      {showSignoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="glass-card max-w-sm w-full p-6 space-y-5 border-zinc-700 shadow-2xl scale-100">
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </div>
            
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Sign Out?</h3>
              <p className="text-xs text-zinc-400">
                Are you sure you want to end your current session? You will be redirected to the access portal.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSignoutModal(false)}
                className="btn-secondary flex-1 py-2.5 text-xs text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-colors shadow-lg shadow-red-600/30 text-center cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IconGrid() {
  return (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function IconCog() {
  return (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
  );
}
