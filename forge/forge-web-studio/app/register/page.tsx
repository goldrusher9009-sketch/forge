import type { Metadata } from 'next';
import { AccountEntryRoute } from '../components/AccountEntryRoute';
type Props = { searchParams: Promise<{ lang?: string | string[] }> };
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> { return { title: (await searchParams).lang === 'zh' ? '创建 Forge 账号' : 'Create your Forge account', robots: { index: true, follow: true } }; }
export default async function Page({ searchParams }: Props) { return <AccountEntryRoute mode="register" initialLanguage={(await searchParams).lang === 'zh' ? 'zh' : 'en'} />; }
