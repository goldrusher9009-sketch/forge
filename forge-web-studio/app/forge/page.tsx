'use client';
import dynamic from 'next/dynamic';

const ForgeApp = dynamic(() => import('@/app/components/ForgeApp'), {
  ssr: false,
  loading: () => null,
});

export default function ForgePage() {
  return <ForgeApp />;
}
