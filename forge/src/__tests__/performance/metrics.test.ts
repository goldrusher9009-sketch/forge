import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  debounce,
  throttle,
  memoryCache,
  localStorageCache,
  performanceMonitor,
  MemoryCache,
  LocalStorageCache,
} from '../../utils/performance';

// ============================================================================
// DEBOUNCE TESTS (6 test cases)
// ============================================================================

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should delay function execution by specified amount', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 300);

    debouncedFn('test');
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('test');
  });

  it('should cancel previous execution on subsequent calls', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 300);

    debouncedFn('first');
    vi.advanceTimersByTime(150);
    debouncedFn('second');
    vi.advanceTimersByTime(150);
    debouncedFn('third');
    
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('third');
  });

  it('should pass arguments to debounced function', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 300);

    debouncedFn('arg1', 'arg2', { key: 'value' });
    vi.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2', { key: 'value' });
  });

  it('should return undefined before execution', () => {
    const fn = vi.fn(() => 'result');
    const debouncedFn = debounce(fn, 300);

    const result = debouncedFn();
    expect(result).toBeUndefined();
  });

  it('should support immediate execution option', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 300, true);

    debouncedFn('test');
    expect(fn).toHaveBeenCalledWith('test');

    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('should reset timer on each call', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 300);

    debouncedFn();
    vi.advanceTimersByTime(200);
    debouncedFn();
    vi.advanceTimersByTime(200);
    debouncedFn();
    vi.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledOnce();
  });
});

// ============================================================================
// THROTTLE TESTS (6 test cases)
// ============================================================================

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should execute function immediately on first call', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 300);

    throttledFn('test');
    expect(fn).toHaveBeenCalledWith('test');
  });

  it('should ignore calls within throttle period', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 300);

    throttledFn('first');
    throttledFn('second');
    throttledFn('third');

    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('first');
  });

  it('should execute after throttle period elapsed', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 300);

    throttledFn('first');
    vi.advanceTimersByTime(300);
    throttledFn('second');

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should queue and execute latest call after throttle period', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 300);

    throttledFn('first');
    throttledFn('second');
    throttledFn('third');

    expect(fn).toHaveBeenCalledOnce();

    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('third');
  });

  it('should pass arguments correctly', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 300);

    throttledFn('arg1', 'arg2', { nested: true });
    expect(fn).toHaveBeenCalledWith('arg1', 'arg2', { nested: true });
  });

  it('should handle multiple throttle periods', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 300);

    throttledFn('call1');
    vi.advanceTimersByTime(300);
    throttledFn('call2');
    vi.advanceTimersByTime(300);
    throttledFn('call3');

    expect(fn).toHaveBeenCalledTimes(3);
  });
});

// ============================================================================
// MEMORY CACHE TESTS (10 test cases)
// ============================================================================

describe('MemoryCache', () => {
  let cache: MemoryCache<string>;

  beforeEach(() => {
    cache = new MemoryCache<string>(5000); // 5 second default TTL
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cache.clear();
  });

  it('should store and retrieve values', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('should return null for missing keys', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('should check key existence', () => {
    cache.set('key1', 'value1');
    expect(cache.has('key1')).toBe(true);
    expect(cache.has('key2')).toBe(false);
  });

  it('should delete entries', () => {
    cache.set('key1', 'value1');
    cache.delete('key1');
    expect(cache.get('key1')).toBeNull();
    expect(cache.has('key1')).toBe(false);
  });

  it('should respect default TTL', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');

    vi.advanceTimersByTime(5000);
    expect(cache.get('key1')).toBeNull();
  });

  it('should support custom TTL per entry', () => {
    cache.set('short', 'value', 1000); // 1 second
    cache.set('long', 'value', 10000); // 10 seconds

    vi.advanceTimersByTime(2000);
    expect(cache.get('short')).toBeNull();
    expect(cache.get('long')).toBe('value');
  });

  it('should clear all entries', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');

    cache.clear();

    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
    expect(cache.get('key3')).toBeNull();
  });

  it('should track cache size', () => {
    expect(cache.size()).toBe(0);
    cache.set('key1', 'value1');
    expect(cache.size()).toBe(1);
    cache.set('key2', 'value2');
    expect(cache.size()).toBe(2);
    cache.delete('key1');
    expect(cache.size()).toBe(1);
  });

  it('should handle complex object values', () => {
    const obj = { nested: { deep: { value: 'test' } }, array: [1, 2, 3] };
    cache.set('complex', obj);
    expect(cache.get('complex')).toEqual(obj);
  });

  it('should auto-cleanup expired entries on access', () => {
    cache.set('key1', 'value1', 1000);
    cache.set('key2', 'value2', 5000);

    vi.advanceTimersByTime(2000);
    
    // Accessing key1 should clean it up
    cache.get('key1');
    
    expect(cache.size()).toBe(1);
    expect(cache.get('key2')).toBe('value2');
  });
});

// ============================================================================
// LOCALSTORAGE CACHE TESTS (8 test cases)
// ============================================================================

describe('LocalStorageCache', () => {
  let cache: LocalStorageCache<unknown>;

  beforeEach(() => {
    cache = new LocalStorageCache<unknown>('test-', 24 * 60 * 60 * 1000); // 24 hour default
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('should persist string values to localStorage', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');

    // Verify it's actually in localStorage
    const stored = localStorage.getItem('test-key1');
    expect(stored).toBeTruthy();
  });

  it('should persist and retrieve complex objects', () => {
    const obj = { id: 1, name: 'Test', nested: { value: true } };
    cache.set('complex', obj);

    const retrieved = cache.get('complex');
    expect(retrieved).toEqual(obj);
  });

  it('should persist arrays', () => {
    const arr = [1, 'two', { three: 3 }, [4, 5]];
    cache.set('array', arr);

    expect(cache.get('array')).toEqual(arr);
  });

  it('should return null for missing keys', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('should respect default TTL', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');

    // Advance time past TTL (24 hours)
    vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1000);
    
    expect(cache.get('key1')).toBeNull();
  });

  it('should support custom TTL per entry', () => {
    cache.set('short', 'value', 1000);
    cache.set('long', 'value', 10000);

    vi.advanceTimersByTime(2000);
    expect(cache.get('short')).toBeNull();
    expect(cache.get('long')).toBe('value');
  });

  it('should handle localStorage quota errors gracefully', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn');

    // Mock localStorage to throw QuotaExceededError
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = vi.fn(() => {
      throw new DOMException('QuotaExceededError');
    });

    cache.set('key1', 'value1');

    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(consoleWarnSpy.mock.calls[0][0]).toContain('LocalStorageCache');

    localStorage.setItem = originalSetItem;
    consoleWarnSpy.mockRestore();
  });

  it('should handle corrupted JSON in storage', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn');

    // Manually insert corrupted data
    localStorage.setItem('test-key1', 'invalid json{]');

    const result = cache.get('key1');

    expect(result).toBeNull();
    expect(consoleWarnSpy).toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });
});

// ============================================================================
// PERFORMANCE MONITOR TESTS (12 test cases)
// ============================================================================

describe('PerformanceMonitor', () => {
  let monitor: typeof performanceMonitor;

  beforeEach(() => {
    monitor = performanceMonitor;
    monitor.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    monitor.clear();
  });

  it('should mark time points', () => {
    expect(() => monitor.mark('start')).not.toThrow();
    expect(() => monitor.mark('end')).not.toThrow();
  });

  it('should measure duration between marks', () => {
    monitor.mark('start');
    vi.advanceTimersByTime(500);
    monitor.mark('end');

    monitor.measure('duration', 'start', 'end');
    const metrics = monitor.getMetrics('duration');

    expect(metrics).toBeTruthy();
    expect(metrics?.duration).toBeGreaterThanOrEqual(500);
  });

  it('should record custom metrics', () => {
    monitor.recordMetric('api-call', 250);
    monitor.recordMetric('api-call', 300);
    monitor.recordMetric('api-call', 200);

    const metrics = monitor.getMetrics('api-call');

    expect(metrics?.count).toBe(3);
    expect(metrics?.total).toBe(750);
  });

  it('should calculate average metric', () => {
    monitor.recordMetric('request', 100);
    monitor.recordMetric('request', 200);
    monitor.recordMetric('request', 300);

    const metrics = monitor.getMetrics('request');
    expect(metrics?.average).toBe(200);
  });

  it('should track min and max values', () => {
    monitor.recordMetric('duration', 50);
    monitor.recordMetric('duration', 150);
    monitor.recordMetric('duration', 200);
    monitor.recordMetric('duration', 25);

    const metrics = monitor.getMetrics('duration');

    expect(metrics?.min).toBe(25);
    expect(metrics?.max).toBe(200);
  });

  it('should handle multiple metric types', () => {
    monitor.recordMetric('api-latency', 200);
    monitor.recordMetric('render-time', 50);
    monitor.recordMetric('api-latency', 250);
    monitor.recordMetric('render-time', 60);

    const apiMetrics = monitor.getMetrics('api-latency');
    const renderMetrics = monitor.getMetrics('render-time');

    expect(apiMetrics?.count).toBe(2);
    expect(renderMetrics?.count).toBe(2);
  });

  it('should return null for non-existent metrics', () => {
    expect(monitor.getMetrics('nonexistent')).toBeNull();
  });

  it('should clear all metrics', () => {
    monitor.recordMetric('metric1', 100);
    monitor.recordMetric('metric2', 200);

    monitor.clear();

    expect(monitor.getMetrics('metric1')).toBeNull();
    expect(monitor.getMetrics('metric2')).toBeNull();
  });

  it('should generate performance report', () => {
    monitor.recordMetric('api-call', 100);
    monitor.recordMetric('api-call', 200);
    monitor.recordMetric('render', 50);

    const report = monitor.report();

    expect(report).toContain('api-call');
    expect(report).toContain('render');
    expect(report).toContain('average');
  });

  it('should handle rapid metric recording', () => {
    for (let i = 0; i < 1000; i++) {
      monitor.recordMetric('rapid-metric', Math.random() * 1000);
    }

    const metrics = monitor.getMetrics('rapid-metric');
    expect(metrics?.count).toBe(1000);
    expect(metrics?.average).toBeGreaterThan(0);
    expect(metrics?.min).toBeLessThan(metrics?.max || 0);
  });

  it('should handle concurrent metric types', () => {
    const types = ['api', 'render', 'memory', 'cpu', 'network'];

    types.forEach((type) => {
      for (let i = 0; i < 10; i++) {
        monitor.recordMetric(type, Math.random() * 500);
      }
    });

    types.forEach((type) => {
      const metrics = monitor.getMetrics(type);
      expect(metrics?.count).toBe(10);
    });
  });
});

// ============================================================================
// SINGLETON INSTANCE TESTS (4 test cases)
// ============================================================================

describe('Singleton Instances', () => {
  afterEach(() => {
    memoryCache.clear();
    localStorageCache.clear();
    performanceMonitor.clear();
    localStorage.clear();
  });

  it('should provide singleton memoryCache instance', () => {
    memoryCache.set('key1', 'value1');
    expect(memoryCache.get('key1')).toBe('value1');
  });

  it('should provide singleton localStorageCache instance', () => {
    localStorageCache.set('persist', { data: 'test' });
    expect(localStorageCache.get('persist')).toEqual({ data: 'test' });
  });

  it('should provide singleton performanceMonitor instance', () => {
    performanceMonitor.recordMetric('test-metric', 100);
    expect(performanceMonitor.getMetrics('test-metric')).toBeTruthy();
  });

  it('should maintain separate caches for different instances', () => {
    const cache1 = new MemoryCache<string>();
    const cache2 = new MemoryCache<string>();

    cache1.set('key', 'value1');
    cache2.set('key', 'value2');

    expect(cache1.get('key')).toBe('value1');
    expect(cache2.get('key')).toBe('value2');
  });
});
