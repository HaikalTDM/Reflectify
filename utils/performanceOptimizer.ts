/**
 * Performance Optimization Utilities
 * Centralized performance helpers for the app
 */

import * as React from 'react';
import { useEffect, useRef, useCallback } from 'react';

/**
 * Debounce function to limit expensive operations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function to limit function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Hook to prevent unnecessary re-renders
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for expensive computations
 */
export function useMemoCompare<T>(
  next: T,
  compare: (previous: T | undefined, next: T) => boolean
): T {
  const previousRef = useRef<T>();
  const previous = previousRef.current;

  const isEqual = compare(previous, next);

  useEffect(() => {
    if (!isEqual) {
      previousRef.current = next;
    }
  });

  return isEqual && previous !== undefined ? previous : next;
}

/**
 * Batch AsyncStorage operations
 */
export class StorageBatcher {
  private queue: Array<{ key: string; value: string }> = [];
  private timeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 100; // ms

  async setItem(key: string, value: string): Promise<void> {
    this.queue.push({ key, value });

    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => this.flush(), this.BATCH_DELAY);
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    const pairs = this.queue.map(({ key, value }) => [key, value] as [string, string]);
    
    try {
      await AsyncStorage.multiSet(pairs);
      this.queue = [];
    } catch (error) {
      console.error('Batch storage error:', error);
    }
  }
}

/**
 * Image optimization helper
 */
export const ImageOptimizer = {
  /**
   * Get optimized image dimensions
   */
  getOptimizedDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
    return {
      width: Math.floor(originalWidth * ratio),
      height: Math.floor(originalHeight * ratio),
    };
  },
};

/**
 * Memory management helper
 */
export const MemoryManager = {
  /**
   * Clear large objects from memory
   */
  clearCache(): void {
    if (global.gc) {
      global.gc();
      console.log('🧹 Garbage collection triggered');
    }
  },

  /**
   * Get memory usage (if available)
   */
  getMemoryUsage(): number | null {
    if (performance && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return null;
  },
};

/**
 * Network request optimizer
 */
export class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private readonly MAX_CONCURRENT = 3;

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.running >= this.MAX_CONCURRENT || this.queue.length === 0) {
      return;
    }

    this.running++;
    const request = this.queue.shift()!;

    try {
      await request();
    } finally {
      this.running--;
      this.process();
    }
  }
}

// Singleton instances
export const storageBatcher = new StorageBatcher();
export const requestQueue = new RequestQueue();

