import { advanceSession, assertAccountToken, clearSession, endAccountSession, refreshAccountToken, sessionRevision, waitForSignOut } from './session-state';

/**
 * Auth helpers — token storage + API call wrapper with auth headers.
 * Uses localStorage for access token, httpOnly cookie for refresh (set by server).
 */

const ACCESS_TOKEN_KEY = 'forge_access_token';
const USER_KEY = 'forge_user';
const FORGE_APP_TOKEN_KEY = 'forge_token';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  /** Mirrors of the ForgeApp session shape, written alongside the canonical fields. */
  name?: string;
  token?: string;
}

// ── Token helpers ─────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(FORGE_APP_TOKEN_KEY)||localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void { clearSession(); }

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
  assertAccountToken(token);
  const generation=sessionRevision();
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  let res = await fetch(url, { ...options, headers, credentials: 'include' });

  if(generation!==sessionRevision())throw new Error('ACCOUNT_SESSION_CHANGED');
  // Try refresh once on 401
  if (res.status === 401 && token) {
    const refreshed = await tryRefresh();
    if(generation!==sessionRevision())throw new Error('ACCOUNT_SESSION_CHANGED');
    if (refreshed) {
      headers.set('Authorization', `Bearer ${refreshed}`);
      res = await fetch(url, { ...options, headers, credentials: 'include' });
    } else {
      clearAccessToken();
      window.location.href = '/login';
    }
  }

  if(generation!==sessionRevision())throw new Error('ACCOUNT_SESSION_CHANGED');
  return res;
}

const tryRefresh=()=>refreshAccountToken(API());

// ── Login / Logout ────────────────────────────────────────────

const API = () => process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export async function login(email: string, password: string): Promise<AuthUser> {
  await waitForSignOut();
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
  const accessToken: string = json.data.accessToken;
  const user: AuthUser = json.data.user;
  advanceSession();
  setAccessToken(accessToken);
  // ForgeApp reads `forge_user` as { id, email, name, token, role } and `forge_token`.
  // Write a superset so the login page and ForgeApp share one session record.
  setUser({ ...user, name: user.firstName || user.email, token: accessToken });
  localStorage.setItem(FORGE_APP_TOKEN_KEY, accessToken);
  window.dispatchEvent(new Event('forge:account-changed'));
  return user;
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
  const confirmed=await endAccountSession(API());
  if(!confirmed)throw new Error('FORGE_REMOTE_LOGOUT_UNCONFIRMED');
  window.location.href='/login';
}
