/**
 * Auth helpers — token storage + API call wrapper with auth headers.
 * Uses localStorage for access token, httpOnly cookie for refresh (set by server).
 */

const ACCESS_TOKEN_KEY = 'forge_access_token';
const USER_KEY = 'forge_user';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

// ── Token helpers ─────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const s = localStorage.getItem(USER_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function setUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ── Auth fetch — adds Bearer header, auto-refreshes on 401 ───

export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  let res = await fetch(url, { ...options, headers, credentials: 'include' });

  // Try refresh once on 401
  if (res.status === 401 && token) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers.set('Authorization', `Bearer ${refreshed}`);
      res = await fetch(url, { ...options, headers, credentials: 'include' });
    } else {
      clearAccessToken();
      window.location.href = '/login';
    }
  }

  return res;
}

async function tryRefresh(): Promise<string | null> {
  try {
    const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';
    const res = await fetch(`${API}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const json = await res.json();
    const newToken = json.data?.accessToken;
    if (newToken) setAccessToken(newToken);
    return newToken ?? null;
  } catch {
    return null;
  }
}

// ── Login / Logout ────────────────────────────────────────────

const API = () => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Login failed');
  }
  setAccessToken(json.data.accessToken);
  setUser(json.data.user);
  return json.data.user;
}

export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<void> {
  const res = await fetch(`${API()}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, firstName, lastName }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Registration failed');
  }
}

export async function logout(): Promise<void> {
  try {
    await authFetch(`${API()}/auth/logout`, { method: 'POST' });
  } catch {
    // ignore
  }
  clearAccessToken();
  window.location.href = '/login';
}
