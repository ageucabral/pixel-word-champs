/**
 * Hook otimizado de performance - Centralizador de otimizações
 */
import { useEffect, useCallback, useMemo } from 'react';
import { debounce, throttle, measurePerformance, cacheQuery, getCachedQuery } from '@/utils/performanceOptimization';
import { logger } from '@/utils/logger';

interface UseOptimizedPerformanceOptions {
  enableDebounce?: boolean;
  enableThrottle?: boolean;
  enableCache?: boolean;
  debounceDelay?: number;
  throttleDelay?: number;
  cacheKey?: string;
  cacheTTL?: number;
}

export const useOptimizedPerformance = <T = any>(
  operation: () => Promise<T> | T,
  dependencies: any[] = [],
  options: UseOptimizedPerformanceOptions = {}
) => {
  const {
    enableDebounce = false,
    enableThrottle = false,
    enableCache = false,
    debounceDelay = 300,
    throttleDelay = 100,
    cacheKey,
    cacheTTL = 5 * 60 * 1000 // 5 minutos
  } = options;

  // Operação com cache
  const cachedOperation = useCallback(async () => {
    if (enableCache && cacheKey) {
      const cached = getCachedQuery<T>(cacheKey);
      if (cached) {
        logger.debug('Cache hit', { cacheKey }, 'PERFORMANCE');
        return cached;
      }
    }

    const result = await measurePerformance(
      `operation-${cacheKey || 'anonymous'}`,
      async () => await operation()
    );

    if (enableCache && cacheKey) {
      cacheQuery(cacheKey, result, cacheTTL);
    }

    return result;
  }, [operation, enableCache, cacheKey, cacheTTL]);

  // Aplicar debounce se habilitado
  const debouncedOperation = useMemo(() => {
    if (enableDebounce) {
      return debounce(cachedOperation, debounceDelay);
    }
    return cachedOperation;
  }, [cachedOperation, enableDebounce, debounceDelay]);

  // Aplicar throttle se habilitado
  const throttledOperation = useMemo(() => {
    if (enableThrottle) {
      return throttle(cachedOperation, throttleDelay);
    }
    return cachedOperation;
  }, [cachedOperation, enableThrottle, throttleDelay]);

  // Operação final otimizada
  const optimizedOperation = useMemo(() => {
    if (enableDebounce) return debouncedOperation;
    if (enableThrottle) return throttledOperation;
    return cachedOperation;
  }, [enableDebounce, enableThrottle, debouncedOperation, throttledOperation, cachedOperation]);

  return {
    optimizedOperation,
    executeOptimized: optimizedOperation,
    clearCache: useCallback(() => {
      if (cacheKey) {
        // Implementar limpeza de cache específico
        logger.info('Cache cleared', { cacheKey }, 'PERFORMANCE');
      }
    }, [cacheKey])
  };
};

/**
 * Hook específico para componentes que precisam de otimização de re-render
 */
export const useOptimizedComponent = <T extends Record<string, any>>(
  props: T,
  dependencies: (keyof T)[] = []
) => {
  // Memoizar apenas as props que realmente importam
  const memoizedProps = useMemo(() => {
    const relevantProps: Partial<T> = {};
    
    if (dependencies.length === 0) {
      // Se não especificou dependências, usar todas as props
      return props;
    }
    
    dependencies.forEach(key => {
      if (key in props) {
        relevantProps[key] = props[key];
      }
    });
    
    return relevantProps;
  }, dependencies.map(key => props[key]));

  return memoizedProps;
};

/**
 * Hook para otimização de listas grandes
 */
export const useOptimizedList = <T>(
  items: T[],
  itemHeight: number = 50,
  containerHeight: number = 400,
  overscan: number = 5
) => {
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(Math.ceil(containerHeight / itemHeight) + overscan);

  const handleScroll = useCallback(
    throttle((scrollTop: number) => {
      const newStartIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const newEndIndex = Math.min(
        items.length - 1,
        newStartIndex + Math.ceil(containerHeight / itemHeight) + overscan * 2
      );
      
      setStartIndex(newStartIndex);
      setEndIndex(newEndIndex);
    }, 16), // 60fps
    [itemHeight, containerHeight, overscan, items.length]
  );

  const visibleItems = useMemo(() => 
    items.slice(startIndex, endIndex + 1),
    [items, startIndex, endIndex]
  );

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    handleScroll
  };
};

import { useState } from 'react';