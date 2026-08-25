'use client';
import Link from 'next/link';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { logout } from '@/lib/auth';

interface NavbarProps {
  role: string;
  userName?: string;
}

const navLinks: Record<string, { href: string; label: string }[]> = {
  BD_AGENT: [
    { href: '/bd/dashboard', label: 'My Projects' },
    { href: '/bd/submit', label: 'New Project' },
    { href: '/bd/chat', label: 'Chat' },
  ],
  ESTIMATION_ENGINEER: [
    { href: '/engineer/dashboard', label: 'My Work' },
    { href: '/engineer/chat', label: 'Chat' },
  ],
  DESIGN_ENGINEER: [
    { href: '/engineer/dashboard', label: 'My Work' },
    { href: '/engineer/chat', label: 'Chat' },
  ],
  ADMIN: [
    { href: '/admin/dashboard', label: 'Projects' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/chat', label: 'Chat' },
    { href: '/admin/audit', label: 'Audit Log' },
  ],
};

export function Navbar({ role, userName }: NavbarProps) {
  const links = navLinks[role] || [];
  return (
    <nav className="bg-zinc-950 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-yellow-400/40 p-0.5 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <img src="/ace-logo.png" alt="ACE Logo" className="w-full h-full object-contain rounded" />
          </div>
          <span className="font-bold text-yellow-400 text-base tracking-wider">ACE <span className="text-white">SERVICES</span></span>
        </Link>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="text-sm text-gray-600 hover:text-primary transition-colors">
            {l.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell />
        <span className="text-sm text-gray-500">{userName}</span>
        <button onClick={() => logout()} className="text-sm text-red-500 hover:text-red-700">
          Logout
        </button>
      </div>
    </nav>
  );
}
