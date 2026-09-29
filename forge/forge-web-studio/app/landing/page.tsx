import type { Metadata } from 'next';
import LandingClient from './LandingClient';

type Props = { searchParams: Promise<{ lang?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const zh = (await searchParams).lang === 'zh';
  const title = zh ? 'Forge — 你的专业，成为 Agent，交付真实成果。' : 'Forge — Your expertise. An Agent that delivers.';
  const description = zh
    ? '用你的资料和标准创建专属 Agent，测评并发布版本，交付可以检查的成果。'
    : 'Create personal AI Agents with your sources, evaluate them, publish versions and review real deliverables. Plans from $29 per month with shared model credit.';
  return { title, description, openGraph: { siteName: 'Forge', type: 'website', url: zh ? '/landing?lang=zh' : '/landing', title, description, locale: zh ? 'zh_CN' : 'en_US' } };
}

export default async function LandingPage({ searchParams }: Props) {
  const initialLanguage = (await searchParams).lang === 'zh' ? 'zh' : 'en';
  return <LandingClient initialLanguage={initialLanguage} />;
}
