// Otimizações de performance para produção

// Cache global para evitar recálculos
const globalCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export const cacheManager = {
  set: (key: string, data: any, ttl: number = 300000) => { // 5 min default
    globalCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  },

  get: (key: string) => {
    const cached = globalCache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      globalCache.delete(key);
      return null;
    }
    
    return cached.data;
  },

  clear: (pattern?: string) => {
    if (!pattern) {
      globalCache.clear();
      return;
    }
    
    for (const key of globalCache.keys()) {
      if (key.includes(pattern)) {
        globalCache.delete(key);
      }
    }
  },

  size: () => globalCache.size
};

// Debounce otimizado
export const createOptimizedDebounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): T => {
  let timeout: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T>;
  
  return ((...args: Parameters<T>) => {
    lastArgs = args;
    
    const later = () => {
      timeout = null;
      if (!immediate) func(...lastArgs);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...lastArgs);
  }) as T;
};

// Throttle otimizado
export const createOptimizedThrottle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T => {
  let inThrottle = false;
  let lastResult: ReturnType<T>;
  
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      lastResult = func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
    return lastResult;
  }) as T;
};

// Request deduplication para evitar requisições duplicadas
const pendingRequests = new Map<string, Promise<any>>();

export const deduplicateRequest = async <T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> => {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T>;
  }
  
  const promise = requestFn().finally(() => {
    pendingRequests.delete(key);
  });
  
  pendingRequests.set(key, promise);
  return promise;
};

// Batch de operações para reduzir re-renders
export const createBatchProcessor = <T>(
  processFn: (items: T[]) => void,
  delay: number = 16 // 1 frame
) => {
  let batch: T[] = [];
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (item: T) => {
    batch.push(item);
    
    if (timeoutId) clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      if (batch.length > 0) {
        processFn([...batch]);
        batch = [];
      }
      timeoutId = null;
    }, delay);
  };
};

// Lazy loading otimizado
export const createLazyLoader = <T>(
  loadFn: () => Promise<T>,
  cacheKey: string,
  ttl: number = 300000
) => {
  return async (): Promise<T> => {
    const cached = cacheManager.get(cacheKey);
    if (cached) return cached;
    
    const result = await deduplicateRequest(cacheKey, loadFn);
    cacheManager.set(cacheKey, result, ttl);
    return result;
  };
};

// Memory leak prevention
export const memoryLeakPrevention = {
  // Cleanup timer references
  cleanupTimers: (refs: React.MutableRefObject<any>[]) => {
    refs.forEach(ref => {
      if (ref.current) {
        clearTimeout(ref.current);
        clearInterval(ref.current);
        ref.current = null;
      }
    });
  },

  // Cleanup abort controllers
  cleanupAbortControllers: (controllers: AbortController[]) => {
    controllers.forEach(controller => {
      if (controller && !controller.signal.aborted) {
        controller.abort();
      }
    });
  },

  // Cleanup observers
  cleanupObservers: (observers: (IntersectionObserver | MutationObserver | ResizeObserver)[]) => {
    observers.forEach(observer => {
      if (observer) {
        observer.disconnect();
      }
    });
  }
};

// Performance monitoring
export const performanceMonitor = {
  mark: (name: string) => {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
    }
  },

  measure: (name: string, startMark: string, endMark?: string) => {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const entries = performance.getEntriesByName(name, 'measure');
        return entries[entries.length - 1]?.duration || 0;
      } catch (e) {
        console.warn('Performance measurement failed:', e);
        return 0;
      }
    }
    return 0;
  },

  clearMarks: (name?: string) => {
    if (typeof performance !== 'undefined' && performance.clearMarks) {
      performance.clearMarks(name);
    }
  },

  clearMeasures: (name?: string) => {
    if (typeof performance !== 'undefined' && performance.clearMeasures) {
      performance.clearMeasures(name);
    }
  }
};

// Production optimizations
export const productionOptimizations = {
  // Disable console logs in production
  disableConsoleInProduction: () => {
    if (import.meta.env.PROD) {
      const noop = () => {};
      console.log = noop;
      console.debug = noop;
      console.info = noop;
      // Keep console.warn and console.error for important messages
    }
  },

  // Optimize React DevTools
  optimizeReactDevTools: () => {
    if (import.meta.env.PROD && typeof window !== 'undefined') {
      // Disable React DevTools in production
      (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
        isDisabled: true,
        supportsFiber: true,
        inject: () => {},
        onCommitFiberRoot: () => {},
        onCommitFiberUnmount: () => {}
      };
    }
  },

  // Initialize all optimizations
  init: () => {
    productionOptimizations.disableConsoleInProduction();
    productionOptimizations.optimizeReactDevTools();
  }
};

// Initialize production optimizations immediately
if (import.meta.env.PROD) {
  productionOptimizations.init();
}
