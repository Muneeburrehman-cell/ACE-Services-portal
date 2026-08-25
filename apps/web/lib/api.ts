const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string) {
  accessToken = token;
  // Persist to sessionStorage so page refreshes within the same tab work
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('access_token', token);
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  // Restore from sessionStorage on page reload
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('access_token');
    if (stored) { accessToken = stored; return stored; }
  }
  return null;
}

export function clearTokens() {
  accessToken = null;
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('user_role');
  }
}

export function setUserRole(role: string) {
  if (typeof window !== 'undefined') sessionStorage.setItem('user_role', role);
}

export function getUserRole(): string | null {
  if (typeof window !== 'undefined') return sessionStorage.getItem('user_role');
  return null;
}

async function doRefresh(): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) { clearTokens(); return null; }
    const data = await res.json();
    setAccessToken(data.accessToken);
    if (data.role) setUserRole(data.role);
    return data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

async function getValidToken(): Promise<string | null> {
  if (accessToken) return accessToken;
  // Try restoring from sessionStorage first
  const stored = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null;
  if (stored) { accessToken = stored; return stored; }
  // Fall back to refresh cookie
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getValidToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401) {
    clearTokens();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || 'Request failed');
  }

  if (res.status === 204) return null as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body?: any) =>
    apiRequest<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: any) =>
    apiRequest<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
};
