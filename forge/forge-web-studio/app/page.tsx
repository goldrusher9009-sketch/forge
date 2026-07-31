'use client';
import dynamic from 'next/dynamic';
const ForgeApp = dynamic(() => import('./components/ForgeApp'), { ssr: false });
export default function Home() {
  return <ForgeApp />;
}
