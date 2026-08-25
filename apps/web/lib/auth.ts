import { setAccessToken, setUserRole, clearTokens, api } from './api';

export interface AuthUser {
  accessToken: string;
  role: string;
}

export async function login(email: string, password: string): Promise<any> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Login failed');
  if (data.accessToken) {
    setAccessToken(data.accessToken);
    setUserRole(data.role);
  }
  return data;
}

export async function verify2fa(pre2faToken: string, totpCode: string): Promise<AuthUser> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/2fa/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pre2faToken, totpCode }),
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '2FA failed');
  setAccessToken(data.accessToken);
  setUserRole(data.role);
  return data;
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } finally {
    clearTokens();
    if (typeof window !== 'undefined') window.location.href = '/login';
  }
}

export function getRoleDashboard(role: string): string {
  if (role === 'BD_AGENT') return '/bd/dashboard';
  if (role === 'ADMIN') return '/admin/dashboard';
  if (role === 'ESTIMATION_ENGINEER' || role === 'DESIGN_ENGINEER') return '/engineer/dashboard';
  return '/login';
}
