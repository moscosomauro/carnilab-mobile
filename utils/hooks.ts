/**
 * Custom Hooks Utilities para CarniLab
 * Hooks reutilizables para mejorar performance y UX
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para debounce de valores
 * Útil para búsquedas en tiempo real sin hacer queries en cada keystroke
 *
 * @param value - Valor a hacer debounce
 * @param delay - Delay en milisegundos (default: 300ms)
 * @returns Valor con debounce aplicado
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebouncedValue(searchTerm, 500);
 *
 * useEffect(() => {
 *   // Esta query solo se ejecuta después de 500ms sin cambios
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export const useDebouncedValue = <T,>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook para paginación con cursor
 * Implementa cursor-based pagination para mejor performance
 *
 * @param fetchFunction - Función que hace fetch de datos paginados
 * @param pageSize - Cantidad de items por página (default: 20)
 * @returns Estado y funciones de paginación
 *
 * @example
 * const {
 *   data,
 *   loading,
 *   hasMore,
 *   loadMore
 * } = usePagination(fetchPlants, 20);
 */
export interface PaginationState<T> {
  data: T[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  reset: () => void;
}

export const usePagination = <T extends { id: number }>(
  fetchFunction: (cursor: number | null, limit: number) => Promise<T[]>,
  pageSize: number = 20
): PaginationState<T> => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const newItems = await fetchFunction(cursor, pageSize);

      if (newItems.length < pageSize) {
        setHasMore(false);
      }

      if (newItems.length > 0) {
        setData(prev => [...prev, ...newItems]);
        // El cursor es el ID del último item
        setCursor(newItems[newItems.length - 1].id);
      } else {
        setHasMore(false);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos');
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, cursor, fetchFunction, pageSize]);

  const reset = useCallback(() => {
    setData([]);
    setCursor(null);
    setHasMore(true);
    setError(null);
  }, []);

  return {
    data,
    loading,
    hasMore,
    error,
    loadMore,
    reset
  };
};

/**
 * Hook para detectar scroll al final (infinite scroll)
 *
 * @param callback - Función a ejecutar al llegar al final
 * @param threshold - Distancia desde el final para trigger (default: 200px)
 *
 * @example
 * useInfiniteScroll(() => {
 *   if (hasMore && !loading) {
 *     loadMore();
 *   }
 * }, 300);
 */
export const useInfiniteScroll = (
  callback: () => void,
  threshold: number = 200
): void => {
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = window.innerHeight;

      if (scrollHeight - scrollTop - clientHeight < threshold) {
        callback();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [callback, threshold]);
};

/**
 * Hook para local storage con TypeScript
 *
 * @param key - Key del localStorage
 * @param initialValue - Valor inicial
 * @returns [value, setValue]
 *
 * @example
 * const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
 */
export const useLocalStorage = <T,>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};
