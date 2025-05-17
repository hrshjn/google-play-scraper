import { useCallback, useRef, useEffect } from 'react';
import { FeedbackItem } from '../types';
import { SortOrder } from '../components/results/ReviewList';
import { useReviews, UseReviewsOptions, UseReviewsReturn } from './useReviews';

interface CacheKey {
  type: string;
  category?: string;
  page: number;
  sortOrder: SortOrder;
}

interface CacheEntry {
  items: FeedbackItem[];
  timestamp: number;
  hasMore: boolean;
}

interface Cache {
  [key: string]: CacheEntry;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useReviewsCache(options: UseReviewsOptions): UseReviewsReturn {
  // Use ref for cache to persist between renders but not trigger updates
  const cache = useRef<Cache>({});
  
  // Get base hook functionality
  const reviewsHook = useReviews(options);
  
  // Generate cache key
  const getCacheKey = useCallback((page: number, sort: SortOrder): string => {
    return JSON.stringify({
      type: options.type,
      category: options.category,
      page,
      sortOrder: sort
    } as CacheKey);
  }, [options.type, options.category]);

  // Check if cache entry is valid
  const isValidCache = useCallback((entry: CacheEntry): boolean => {
    return Date.now() - entry.timestamp < CACHE_DURATION;
  }, []);

  // Wrap the original loadMore with caching
  const loadMoreWithCache = useCallback(async () => {
    const nextPage = reviewsHook.page + 1;
    const cacheKey = getCacheKey(nextPage, reviewsHook.sortOrder);
    const cached = cache.current[cacheKey];

    if (cached && isValidCache(cached)) {
      // Use cached data
      return Promise.resolve().then(() => {
        reviewsHook.setItems(prev => [...prev, ...cached.items]);
        reviewsHook.setHasMore(cached.hasMore);
        reviewsHook.setPage(nextPage);
      });
    }

    // No valid cache, perform actual fetch
    const result = await reviewsHook.loadMore();

    // Cache the new results
    cache.current[cacheKey] = {
      items: reviewsHook.items.slice(-options.pageSize!), // Last page's items
      timestamp: Date.now(),
      hasMore: reviewsHook.hasMore
    };

    return result;
  }, [reviewsHook, getCacheKey, isValidCache, options.pageSize]);

  // Wrap sort change with cache handling
  const setSortOrderWithCache = useCallback(async (newOrder: SortOrder) => {
    const cacheKey = getCacheKey(1, newOrder);
    const cached = cache.current[cacheKey];

    if (cached && isValidCache(cached)) {
      // Use cached data
      return Promise.resolve().then(() => {
        reviewsHook.setItems(cached.items);
        reviewsHook.setHasMore(cached.hasMore);
        reviewsHook.setPage(1);
        reviewsHook.setSortOrder(newOrder);
      });
    }

    // No valid cache, perform actual fetch
    return reviewsHook.setSortOrder(newOrder);
  }, [reviewsHook, getCacheKey, isValidCache]);

  // Clear cache when options change
  useEffect(() => {
    cache.current = {};
  }, [options.type, options.category]);

  return {
    ...reviewsHook,
    loadMore: loadMoreWithCache,
    setSortOrder: setSortOrderWithCache
  };
} 