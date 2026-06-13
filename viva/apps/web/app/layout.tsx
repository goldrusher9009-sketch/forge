import type { Metadata, Viewport } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'VIVA — Life Operating System',
  description: 'Your sovereign life operating system. V-Score, health, identity, markets — all yours.',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'VIVA',
    description: 'Life Operating System',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#04040A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
