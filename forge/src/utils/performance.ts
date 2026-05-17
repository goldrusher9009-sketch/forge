/**
 * Performance Optimization Utilities
 * Handles caching, debouncing, throttling, and performance monitoring
 */

// Debounce utility for reducing function call frequency
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
}

// Throttle utility for rate-limiting function calls
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// Memory cache with TTL (Time To Live)
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

export class MemoryCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) {
    // Default 5 minutes
    this.defaultTTL = defaultTTL;
  }

  set(key: string, value: T, ttl?: number): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const elapsed = Date.now() - entry.timestamp;
    if (elapsed > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// LocalStorage cache with TTL
export class LocalStorageCache {
  private prefix: string = 'cache_';
  private defaultTTL: number;

  constructor(defaultTTL: number = 24 * 60 * 60 * 1000) {
    // Default 24 hours
    this.defaultTTL = defaultTTL;
  }

  set(key: string, value: any, ttl?: number): void {
    try {
      const entry = {
        value,
        timestamp: Date.now(),
        ttl: ttl || this.defaultTTL,
      };
      localStorage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch (error) {
      console.warn('LocalStorage cache set error:', error);
    }
  }

  get(key: string): any | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) {
        return null;
      }

      const entry = JSON.parse(item);
      const elapsed = Date.now() - entry.timestamp;

      if (elapsed > entry.ttl) {
        this.delete(key);
        return null;
      }

      return entry.value;
    } catch (error) {
      console.warn('LocalStorage cache get error:', error);
      return null;
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.warn('LocalStorage cache delete error:', error);
    }
  }

  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('LocalStorage cache clear error:', error);
    }
  }
}

// Performance monitoring and reporting
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private metrics: Map<string, number[]> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string): number {
    const startTime = this.marks.get(startMark);
    const endTime = endMark ? this.marks.get(endMark) : performance.now();

    if (!startTime || !endTime) {
      console.warn(`Performance marks not found for ${name}`);
      return 0;
    }

    const duration = endTime - startTime;
    this.recordMetric(name, duration);

    return duration;
  }

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  getMetrics(name: string): {
    values: number[];
    average: number;
    min: number;
    max: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return null;
    }

    return {
      values,
      average: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  report(): void {
    console.table(
      Array.from(this.metrics.entries()).map(([name, values]) => ({
        metric: name,
        count: values.length,
        average: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
        min: Math.min(...values).toFixed(2),
        max: Math.max(...values).toFixed(2),
      }))
    );
  }

  clear(): void {
    this.marks.clear();
    this.metrics.clear();
  }
}

// Create singleton instances
export const memoryCache = new MemoryCache();
export const localStorageCache = new LocalStorageCache();
export const performanceMonitor = new PerformanceMonitor();
