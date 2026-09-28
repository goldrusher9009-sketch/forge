'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { AccountEntry } from './AccountEntry';
import { advanceSession, sessionRevision, waitForSignOut, assertAccountToken, refreshAccountToken } from '../../lib/session-state';

import { readUiLanguage } from '../../lib/ui-language';
import { WorkspaceStatus } from './WorkspaceStatus';

const API = '/api';

// Same request contract as the workspace's apiFetch, without the 2 MB workspace bundle.
async function request(path: string, opts: RequestInit = {}, token?: string, retried = false): Promise<any> {
  if (path === '/auth/login') await waitForSignOut();
  assertAccountToken(token);
  const generation = sessionRevision();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(opts.headers as any) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const signal = opts.signal ?? (opts.method === 'POST' ? AbortSignal.timeout(60000) : undefined);
  const res = await fetch(`${API}${path}`, { ...opts, headers, credentials: 'include', cache: 'no-store', ...(signal ? { signal } : {}) });
  if (generation !== sessionRevision()) throw new Error('ACCOUNT_SESSION_CHANGED');
  if (res.status === 401 && token && !retried) {
    const fresh = await refreshAccountToken(API);
    if (fresh) return request(path, opts, fresh, true);
  }
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || err.error || `HTTP ${res.status}`); }
  const data = await res.json().catch(() => ({}));
  if (generation !== sessionRevision()) throw new Error('ACCOUNT_SESSION_CHANGED');
  return data;
}

/** Standalone sign-in / sign-up route. Renders instantly and hands a signed-in account to the workspace at "/". */
export function AccountEntryRoute({ mode }: { mode: 'login' | 'register' }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Keep `?auth=` and `?lang=` in the address so AccountEntry reads mode and language the same way as before.
    const url = new URL(window.location.href);
    let changed = false;
    if (url.searchParams.get('auth') !== mode) { url.searchParams.set('auth', mode); changed = true; }
    if (!url.searchParams.get('lang')) { url.searchParams.set('lang', readUiLanguage()); changed = true; }
    if (changed) window.history.replaceState(null, '', url.pathname + url.search);
    // Already signed in on this device: go straight to the workspace.
    try { const stored = JSON.parse(localStorage.getItem('forge_user') || 'null'); if (stored?.id && (stored.token || localStorage.getItem('forge_token'))) { window.location.replace('/?lang=' + readUiLanguage()); return; } } catch {}
    setReady(true);
  }, [mode]);
  const onLogin = useCallback((u: any) => {
    advanceSession();
    localStorage.setItem('forge_user', JSON.stringify(u));
    if (u.token) { localStorage.setItem('forge_token', u.token); localStorage.setItem('forge_access_token', u.token); }
    window.location.replace('/?lang=' + readUiLanguage());
  }, []);
  if (!ready) return <WorkspaceStatus />;
  return <AccountEntry request={(path, options) => request(path, options)} onLogin={onLogin} />;
}