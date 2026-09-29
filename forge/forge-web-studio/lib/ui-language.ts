'use client';

import { useEffect, useState } from 'react';

export type UiLanguage = 'en' | 'zh';
const key = 'forge_ui_language';
const eventName = 'forge:language-changed';
const valid = (value: unknown): value is UiLanguage => value === 'en' || value === 'zh';

export function resolveUiLanguage(search: string, saved: unknown, browserLanguage: string): UiLanguage {
  const explicit = new URLSearchParams(search).get('lang');
  if (valid(explicit)) return explicit;
  if (valid(saved)) return saved;
  return browserLanguage.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function readUiLanguage(): UiLanguage {
  if (typeof window === 'undefined') return 'en';
  let saved: string | null = null;
  try {
    for (const name of [key, 'forge_library_language', 'forge_billing_language']) {
      const candidate = localStorage.getItem(name);
      if (valid(candidate)) { saved = candidate; break; }
    }
  } catch { /* Language still works when browser storage is unavailable. */ }
  return resolveUiLanguage(window.location.search, saved, navigator.language);
}

export function setUiLanguage(language: UiLanguage) {
  if (!valid(language)) return;
  try { localStorage.setItem(key, language); } catch {}
  const url = new URL(window.location.href);
  url.searchParams.set('lang', language);
  window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  window.dispatchEvent(new CustomEvent(eventName, { detail: language }));
}

/** Interface language is independent of the model's response-language setting. */
export function useUiLanguage(initialLanguage: UiLanguage = 'en') {
  const [language, update] = useState<UiLanguage>(initialLanguage);
  useEffect(() => {
    const sync = () => {
      const next = readUiLanguage();
      update(next);
      try { localStorage.setItem(key, next); } catch {}
      document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
    };
    const storage = (event: StorageEvent) => {
      if (event.key === key && valid(event.newValue)) setUiLanguage(event.newValue);
    };
    sync();
    window.addEventListener(eventName, sync);
    window.addEventListener('storage', storage);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener(eventName, sync);
      window.removeEventListener('storage', storage);
      window.removeEventListener('popstate', sync);
    };
  }, []);
  return [language, setUiLanguage] as const;
}
