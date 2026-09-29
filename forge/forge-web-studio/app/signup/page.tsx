import type { Metadata } from 'next';
import { AccountEntryRoute } from '../components/AccountEntryRoute';
export const metadata: Metadata = { title: 'Create your Forge account', robots: { index: true, follow: true } };
export default async function Page({ searchParams }: { searchParams: Promise<{ lang?: string | string[] }> }) { return <AccountEntryRoute mode="register" initialLanguage={(await searchParams).lang === 'zh' ? 'zh' : 'en'} />; }
