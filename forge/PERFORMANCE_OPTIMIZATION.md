# Performance Optimization Guide

## Overview

This document outlines the performance optimization strategies implemented in the Forge Platform frontend. The goal is to ensure fast load times, smooth interactions, and minimal resource consumption.

## Key Metrics

Target performance benchmarks:

- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms
- **Main Bundle Size**: < 200KB (gzipped < 60KB)
- **Total Page Size**: < 1MB (gzipped < 300KB)

## Code Splitting Strategy

### Route-Based Code Splitting

Routes are lazy-loaded to reduce initial bundle size:

```typescript
import { LazyDashboardPage, LazyWorkflowsPage } from '@/routes/lazy';

const router = createBrowserRouter([
  {
    path: '/dashboard',
    element: <LazyDashboardPage />,
  },
  {
    path: '/workflows',
    element: <LazyWorkflowsPage />,
  },
]);
```

Benefits:
- Initial bundle only contains auth pages
- Dashboard and feature pages load on-demand
- Significantly reduces Time to Interactive

### Vendor Code Splitting

Large dependencies are split into separate chunks:

```
chunks/
├── react-vendor.[hash].js      (~40KB gzipped)
├── ui-vendor.[hash].js         (~30KB gzipped)
├── utils-vendor.[hash].js      (~20KB gzipped)
└── main.[hash].js              (~50KB gzipped)
```

### Feature Module Splitting

Heavy features load separately:

```typescript
// Charts only load when needed
export const ChartsPage = lazy(() =>
  import('../pages/analytics/Charts')
);

// Forms utilities loaded separately
export const AdvancedForms = lazy(() =>
  import('../pages/forms/Advanced')
);
```

## Caching Strategies

### Memory Cache

For short-lived data (API responses, computed values):

```typescript
import { memoryCache } from '@/utils/performance';

// Set cache (5 minute default TTL)
memoryCache.set('user-profile', userData);

// Get from cache
const cached = memoryCache.get('user-profile');
```

Use cases:
- API response caching
- Computed calculations
- Temporary UI state

TTL: 5 minutes (configurable)
Size: Limited by available memory

### LocalStorage Cache

For persistent data across sessions:

```typescript
import { localStorageCache } from '@/utils/performance';

// Set cache (24 hour default TTL)
localStorageCache.set('user-preferences', preferences);

// Retrieve on app load
const prefs = localStorageCache.get('user-preferences');
```

Use cases:
- User preferences
- Form drafts
- Cached API responses
- User session state

TTL: 24 hours (configurable)
Size: Limited by browser (usually 5-10MB)

### Browser HTTP Caching

Leveraging HTTP headers:

```
Cache-Control: public, max-age=31536000 (1 year for versioned assets)
Cache-Control: public, max-age=3600 (1 hour for HTML/API responses)
Cache-Control: no-cache, must-revalidate (for dynamic content)
```

Configuration in `vite.config.ts`:

```typescript
// Assets use content hash for cache busting
assetFileNames: 'assets/[name].[hash][extname]',
entryFileNames: 'js/[name].[hash].js',
chunkFileNames: 'chunks/[name].[hash].js',
```

## Bundle Analysis

### Analyzing Bundle Size

```bash
# Build and analyze
npm run build
npm run analyze

# View analysis
open build/bundle-analysis.html
```

### Bundle Breakdown

Expected bundle composition:

| Component | Size | Gzipped | % of Total |
|-----------|------|---------|-----------|
| React + DOM | 40KB | 13KB | 20% |
| React Router | 10KB | 3KB | 5% |
| Auth Logic | 15KB | 5KB | 8% |
| UI Components | 35KB | 10KB | 17% |
| Utils & Hooks | 25KB | 7KB | 12% |
| Other (styles, etc) | 25KB | 8KB | 12% |
| Vendor Split | 50KB | 16KB | 26% |
| **Total** | **200KB** | **62KB** | **100%** |

### Reducing Bundle Size

1. **Tree Shaking**
   - Import only needed functions
   - ✅ Use ES6 imports
   - ❌ Avoid default exports for utilities

2. **Dynamic Imports**
   ```typescript
   // Load heavy modules on-demand
   const charts = await import('chart.js');
   ```

3. **Dependency Audits**
   ```bash
   npm ls
   npm audit
   npm outdated
   ```

4. **Remove Dead Code**
   ```bash
   npm run analyze  # Identify unused code
   ```

## Runtime Performance

### Debouncing & Throttling

Prevent excessive function calls:

```typescript
import { debounce, throttle } from '@/utils/performance';

// Debounce for search (wait until user stops typing)
const handleSearch = debounce((query) => {
  api.searchWorkflows(query);
}, 300); // Wait 300ms after user stops typing

// Throttle for scroll events (max once per 100ms)
const handleScroll = throttle(() => {
  updateActiveSection();
}, 100);
```

Best practices:
- Search/filter: use debounce (300-500ms)
- Scroll/resize: use throttle (100-250ms)
- Input validation: use debounce (200-300ms)

### Component Performance

Using React.memo for expensive components:

```typescript
interface ComplexChartProps {
  data: ChartData;
  config: ChartConfig;
}

export const ComplexChart = React.memo(
  ({ data, config }: ComplexChartProps) => {
    // Complex rendering logic
  },
  (prev, next) => {
    // Custom comparison for deep equality
    return (
      prev.data === next.data &&
      prev.config === next.config
    );
  }
);
```

### Virtual Scrolling

For large lists:

```typescript
import { FixedSizeList as List } from 'react-window';

const WorkflowList = ({ items }) => (
  <List
    height={600}
    itemCount={items.length}
    itemSize={60}
    width="100%"
  >
    {({ index, style }) => (
      <div style={style}>
        {items[index].name}
      </div>
    )}
  </List>
);
```

Benefits:
- Only render visible items
- Smooth scrolling even with 10,000+ items
- Reduced DOM nodes

## Network Optimization

### Request Batching

Combine multiple API calls:

```typescript
// Instead of multiple requests
const user = await api.getUser();
const workflows = await api.getWorkflows();
const agents = await api.getAgents();

// Batch into single request
const data = await api.getDashboardData();
```

### Response Compression

Gzip/Brotli compression (configured server-side):

```
Content-Encoding: gzip
Content-Encoding: br (Brotli)
```

Expected compression ratios:
- HTML/Text: 70% reduction
- JavaScript: 65% reduction
- CSS: 80% reduction
- JSON: 75% reduction

### Lazy Loading Images

```typescript
import { useImageLazyLoad } from '@/hooks/useImageLazyLoad';

export const WorkflowCard = ({ image }) => {
  const { ref, src } = useImageLazyLoad(image);

  return (
    <img
      ref={ref}
      src={src}
      alt="Workflow"
      loading="lazy"
    />
  );
};
```

## Monitoring Performance

### Real User Monitoring (RUM)

Tracking performance metrics:

```typescript
import { performanceMonitor } from '@/utils/performance';

// Mark start of operation
performanceMonitor.mark('workflow-load-start');

// ... load workflow ...

// Measure duration
performanceMonitor.measure(
  'workflow-load',
  'workflow-load-start'
);

// Report metrics
performanceMonitor.report();
```

### Web Vitals

Monitoring Core Web Vitals:

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS((metric) => console.log('CLS:', metric.value));
getFID((metric) => console.log('FID:', metric.value));
getFCP((metric) => console.log('FCP:', metric.value));
getLCP((metric) => console.log('LCP:', metric.value));
getTTFB((metric) => console.log('TTFB:', metric.value));
```

### Performance Dashboard

Access metrics in Grafana:

- Page load times
- API response times
- Bundle sizes
- Cache hit rates
- Core Web Vitals

## Optimization Checklist

### Before Deployment

- [ ] Bundle size analyzed and < 200KB gzipped
- [ ] Core Web Vitals meeting targets
- [ ] All images optimized and using lazy loading
- [ ] Code splitting configured for routes
- [ ] Caching strategies implemented
- [ ] Debouncing/throttling applied to event handlers
- [ ] Unused dependencies removed
- [ ] Tree shaking enabled in build config
- [ ] Production builds tested locally
- [ ] Performance metrics configured and monitored

### Ongoing

- [ ] Monitor real user metrics weekly
- [ ] Analyze bundle reports for regressions
- [ ] Review and optimize slow endpoints
- [ ] Update dependencies for security and performance
- [ ] A/B test performance improvements
- [ ] Document performance regressions and fixes

## Tools & Resources

- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Audit performance
- [WebPageTest](https://www.webpagetest.org/) - Detailed performance analysis
- [Bundle Phobia](https://bundlephobia.com/) - Analyze npm package sizes
- [Bundlejs](https://bundle.js.org/) - Quick bundle size checker
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/) - Network and performance profiling

## References

- [Web Vitals](https://web.dev/vitals/)
- [React Performance](https://react.dev/reference/react/memo)
- [Vite Documentation](https://vitejs.dev/)
- [MDN Performance Guide](https://developer.mozilla.org/en-US/docs/Web/Performance)
