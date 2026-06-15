import type { Metadata, Viewport } from 'next'
import '../styles/globals.css'
import { ToastProvider } from '@/components/ui/Toast'

const SITE_URL = 'https://viva-platform-eight.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'VIVA — Life Operating System',
    template: '%s | VIVA',
  },
  description: 'VIVA tracks your health, wealth, identity and social capital in real time. Quantify your life, stake on outcomes, trade your reputation on-chain.',
  keywords: ['life operating system', 'health tracking', 'V-Score', 'prediction markets', 'ZK identity', 'social capital', 'biometric NFT'],
  authors: [{ name: 'VIVA' }],
  creator: 'VIVA',
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.ico', apple: '/favicon.ico' },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'VIVA',
    title: 'VIVA — Life Operating System',
    description: 'Quantify your life. Stake on yourself. Own your identity on-chain.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'VIVA Life Operating System' }],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VIVA — Life Operating System',
    description: 'Quantify your life. Stake on yourself. Own your identity on-chain.',
    images: ['/og.png'],
  },
  alternates: { canonical: SITE_URL },
}

export const viewport: Viewport = {
  themeColor: '#04040A',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
