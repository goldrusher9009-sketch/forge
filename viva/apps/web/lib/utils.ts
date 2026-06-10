import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

export function formatRelTime(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return 'just now'
  if (h < 1) return `${m}m`
  if (d < 1) return `${h}h`
  return `${d}d`
}

export function getVScoreTier(score: number) {
  if (score >= 800) return 'sovereign'
  if (score >= 600) return 'guardian'
  if (score >= 400) return 'stable'
  if (score >= 200) return 'rising'
  return 'seed'
}
