'use client'
import { usePathname } from 'next/navigation'
import { AppShell } from './AppShell'

// Pages that render WITHOUT the app shell (full-screen standalone)
const NO_SHELL = ['/', '/auth', '/admin']

export function ShellWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const bare = NO_SHELL.some(p => p === pathname || pathname.startsWith(p + '/'))
  if (bare) return <>{children}</>
  return <AppShell>{children}</AppShell>
}
