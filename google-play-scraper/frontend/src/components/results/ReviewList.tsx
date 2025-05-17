import React from 'react';
import { FeedbackItem as FeedbackItemType } from '../../types';
import FeedbackItem from './FeedbackItem';
import { Loader2 } from 'lucide-react';

export type SortOrder = 'date_asc' | 'date_desc' | 'rating_asc' | 'rating_desc';

interface ReviewListProps {
  items: FeedbackItemType[];
  type: 'complaint' | 'praise' | 'feature';
  page: number;
  pageSize: number;
  totalItems?: number;
  isLoading?: boolean;
  sortOrder?: SortOrder;
  onLoadMore?: () => Promise<void>;
  onSortChange?: (order: SortOrder) => void;
  useInfiniteScroll?: boolean;
}

const ReviewList: React.FC<ReviewListProps> = ({
  items,
  type,
  page,
  pageSize,
  totalItems,
  isLoading = false,
  sortOrder,
  onLoadMore,
  onSortChange,
  useInfiniteScroll = false,
}) => {
  const [loadingMore, setLoadingMore] = React.useState(false);
  const observerTarget = React.useRef<HTMLDivElement>(null);

  // Handle infinite scroll with IntersectionObserver
  React.useEffect(() => {
    if (!useInfiniteScroll || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && !loadingMore) {
          setLoadingMore(true);
          onLoadMore().finally(() => setLoadingMore(false));
        }
      },
      { threshold: 0.5 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [useInfiniteScroll, onLoadMore, isLoading, loadingMore]);

  // Render loading skeletons
  const renderSkeleton = () => (
    <div className="animate-pulse space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="py-4">
          <div className="flex items-start space-x-3">
            <div className="h-5 w-5 rounded-full bg-gray-200" />
            <div className="flex-1">
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="mt-2 h-3 w-full bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Render empty state
  if (!isLoading && items.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <p>No reviews yet</p>
      </div>
    );
  }

  const showLoadMore = !useInfiniteScroll && 
    onLoadMore && 
    totalItems && 
    items.length < totalItems;

  return (
    <div className="space-y-4">
      {/* Sorting Controls */}
      {onSortChange && (
        <div className="flex justify-end mb-4">
          <select
            className="text-sm border rounded-md px-2 py-1"
            value={sortOrder}
            onChange={(e) => onSortChange(e.target.value as SortOrder)}
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="rating_desc">Highest Rating</option>
            <option value="rating_asc">Lowest Rating</option>
          </select>
        </div>
      )}

      {/* Reviews List */}
      <div className="divide-y divide-gray-100">
        {items.map((item, index) => (
          <FeedbackItem
            key={`${index}-${item.quote}`}
            item={item}
            type={type}
          />
        ))}
      </div>

      {/* Loading States */}
      {isLoading && renderSkeleton()}

      {/* Load More Button or Infinite Scroll Target */}
      {showLoadMore && (
        <div className="flex justify-center mt-4">
          <button
            className="text-blue-500 hover:underline disabled:opacity-50"
            onClick={() => {
              setLoadingMore(true);
              onLoadMore?.().finally(() => setLoadingMore(false));
            }}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Show more'
            )}
          </button>
        </div>
      )}

      {useInfiniteScroll && (
        <div ref={observerTarget} className="h-4" />
      )}
    </div>
  );
};

export default ReviewList; 