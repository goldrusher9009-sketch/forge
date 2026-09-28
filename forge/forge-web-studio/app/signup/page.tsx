import type { Metadata } from 'next';
import { AccountEntryRoute } from '../components/AccountEntryRoute';
export const metadata: Metadata = { title: 'Create your Forge account', robots: { index: true, follow: true } };
export default function Page() { return <AccountEntryRoute mode="register" />; }
