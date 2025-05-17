import { useState, useCallback, useEffect } from 'react';
import { FeedbackCategory, FeedbackItem } from '../types';
import { SortOrder } from '../components/results/ReviewList';

export interface UseReviewsOptions {
  initialItems?: FeedbackItem[];
  pageSize?: number;
  category?: string;
  type: 'complaint' | 'praise' | 'feature';
  totalCount?: number;
}

export interface UseReviewsReturn {
  items: FeedbackItem[];
  isLoading: boolean;
  error: Error | null;
  page: number;
  hasMore: boolean;
  sortOrder: SortOrder;
  loadMore: () => Promise<void>;
  setSortOrder: (order: SortOrder) => Promise<void>;
  // Internal setters exposed for caching layer
  setItems: (items: FeedbackItem[] | ((prev: FeedbackItem[]) => FeedbackItem[])) => void;
  setHasMore: (hasMore: boolean) => void;
  setPage: (page: number) => void;
}

export function useReviews({
  initialItems = [],
  pageSize = 5,
  category,
  type,
  totalCount
}: UseReviewsOptions): UseReviewsReturn {
  const [items, setItems] = useState<FeedbackItem[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortOrder, setSortOrder] = useState<SortOrder>('date_desc');

  // Update hasMore based on totalCount
  useEffect(() => {
    if (totalCount !== undefined) {
      setHasMore(items.length < totalCount);
    }
  }, [items.length, totalCount]);

  const fetchReviews = useCallback(async (
    pageNum: number,
    order: SortOrder
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      // For now, use the initial items as a mock API response
      // TODO: Replace with actual API integration once backend is ready
      const mockResponse = {
        items: initialItems.slice((pageNum - 1) * pageSize, pageNum * pageSize),
        hasMore: totalCount ? (pageNum * pageSize) < totalCount : false
      };

      if (pageNum === 1) {
        setItems(mockResponse.items);
      } else {
        setItems(prev => [...prev, ...mockResponse.items]);
      }
      
      setHasMore(mockResponse.hasMore);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch reviews'));
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [initialItems, pageSize, totalCount]);

  const loadMore = useCallback(async () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      await fetchReviews(nextPage, sortOrder);
      setPage(nextPage);
    }
  }, [isLoading, hasMore, page, sortOrder, fetchReviews]);

  const handleSortChange = useCallback(async (newOrder: SortOrder) => {
    setSortOrder(newOrder);
    setPage(1);
    await fetchReviews(1, newOrder);
  }, [fetchReviews]);

  // Initial load
  useEffect(() => {
    fetchReviews(1, sortOrder);
  }, [category, sortOrder, fetchReviews]);

  return {
    items,
    isLoading,
    error,
    page,
    hasMore,
    sortOrder,
    loadMore,
    setSortOrder: handleSortChange,
    setItems,
    setHasMore,
    setPage
  };
} 