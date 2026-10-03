import type { Metadata } from 'next';
import { AccountEntryRoute } from '../components/AccountEntryRoute';
type Props = { searchParams: Promise<{ lang?: string | string[] }> };
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> { return { title: (await searchParams).lang === 'zh' ? '登录 · Forge' : 'Sign in · Forge', robots: { index: true, follow: true } }; }
export default async function Page({ searchParams }: Props) { return <AccountEntryRoute mode="login" initialLanguage={(await searchParams).lang === 'zh' ? 'zh' : 'en'} />; }
