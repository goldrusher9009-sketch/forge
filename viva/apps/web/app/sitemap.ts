import type { MetadataRoute } from 'next'

const BASE = 'https://viva-platform-eight.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const pages = [
    { url: '/', priority: 1.0, changeFrequency: 'weekly' as const },
    { url: '/feed', priority: 0.8, changeFrequency: 'daily' as const },
    { url: '/markets', priority: 0.8, changeFrequency: 'hourly' as const },
    { url: '/rooms', priority: 0.8, changeFrequency: 'hourly' as const },
    { url: '/health', priority: 0.7, changeFrequency: 'daily' as const },
    { url: '/twin', priority: 0.7, changeFrequency: 'daily' as const },
    { url: '/dating', priority: 0.7, changeFrequency: 'daily' as const },
    { url: '/messages', priority: 0.6, changeFrequency: 'daily' as const },
    { url: '/notifications', priority: 0.5, changeFrequency: 'daily' as const },
    { url: '/settings', priority: 0.4, changeFrequency: 'monthly' as const },
  ]
  return pages.map(p => ({ url: BASE + p.url, lastModified: now, changeFrequency: p.changeFrequency, priority: p.priority }))
}
