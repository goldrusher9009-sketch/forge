'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { readUiLanguage } from '../lib/ui-language';
import { WorkspaceStatus } from './components/WorkspaceStatus';
const ForgeApp = dynamic(() => import('./components/ForgeApp'), { ssr: false, loading: () => <WorkspaceStatus /> });

function hasStoredSession(): boolean {
  try {
    const stored = JSON.parse(localStorage.getItem('forge_user') || 'null');
    return Boolean(stored?.id && (stored.token || localStorage.getItem('forge_token')));
  } catch { return false; }
}

export default function Home() {
  const [state, setState] = useState<'checking' | 'workspace'>('checking');
  useEffect(() => {
    if (hasStoredSession()) { setState('workspace'); return; }
    // No account on this device: send to the lightweight sign-in / sign-up page instead of loading the workspace bundle.
    const q = new URLSearchParams(window.location.search);
    const target = q.get('auth') === 'register' ? '/register' : '/login';
    const lang = readUiLanguage();
    window.location.replace(`${target}?lang=${lang}`);
  }, []);
  if (state !== 'workspace') return <WorkspaceStatus />;
  return <ForgeApp />;
}
