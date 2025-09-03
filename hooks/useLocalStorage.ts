import { useState, useEffect } from 'react';

export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};

export const useApiCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  cacheTime: number = 30000 // 30 seconds default
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await fetcher();
        setData(result);
        
        const cacheItem = {
          data: result,
          timestamp: Date.now(),
        };
        localStorage.setItem(key, JSON.stringify(cacheItem));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    const cached = localStorage.getItem(key);
    if (cached) {
      try {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        const isExpired = Date.now() - timestamp > cacheTime;
        
        if (!isExpired) {
          setData(cachedData);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error reading cache:', error);
      }
    }

    fetchData();
  }, [key, cacheTime]);

  return { data, loading, error };
};
