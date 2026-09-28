import type { Metadata } from 'next';
import { AccountEntryRoute } from '../components/AccountEntryRoute';
export const metadata: Metadata = { title: 'Sign in · Forge', robots: { index: true, follow: true } };
export default function Page() { return <AccountEntryRoute mode="login" />; }
