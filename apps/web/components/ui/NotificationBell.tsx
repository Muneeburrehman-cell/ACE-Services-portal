'use client';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { getNotificationsSocket } from '@/lib/socket';

export function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<any>('/notifications?limit=10').then((res) => {
      setUnread(res.unreadCount ?? 0);
      setNotifications(res.data ?? []);
    }).catch(() => {});

    try {
      const socket = getNotificationsSocket();
      socket.on('notification', (n: any) => {
        setUnread((u) => u + 1);
        setNotifications((p) => [n, ...p.slice(0, 9)]);
      });
      return () => { socket.off('notification'); };
    } catch { return; }
  }, []);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  async function markAll() {
    await api.patch('/notifications/read-all').catch(() => {});
    setUnread(0);
    setNotifications((p) => p.map((n) => ({ ...n, read: true })));
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-zinc-100">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-yellow-400 text-zinc-900 
            text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 glass-card p-0 overflow-hidden animate-scale-in z-50 shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700/50">
            <p className="font-semibold text-sm">Notifications</p>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-zinc-700/30">
            {notifications.length === 0 && (
              <div className="p-6 text-center text-zinc-600 text-sm">No notifications</div>
            )}
            {notifications.map((n) => (
              <div key={n.id} className={`px-4 py-3 transition-colors ${!n.read ? 'bg-yellow-400/5' : ''}`}>
                <div className="flex gap-2.5">
                  {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0 mt-1.5" />}
                  <div className={!n.read ? '' : 'pl-4'}>
                    <p className="text-sm font-medium text-zinc-200">{n.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{n.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
