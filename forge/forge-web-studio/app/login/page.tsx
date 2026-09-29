import type { Metadata } from 'next';
import { AccountEntryRoute } from '../components/AccountEntryRoute';
export const metadata: Metadata = { title: 'Sign in · Forge', robots: { index: true, follow: true } };
export default async function Page({ searchParams }: { searchParams: Promise<{ lang?: string | string[] }> }) { return <AccountEntryRoute mode="login" initialLanguage={(await searchParams).lang === 'zh' ? 'zh' : 'en'} />; }
