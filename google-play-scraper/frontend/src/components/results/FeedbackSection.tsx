import React, { useState, useMemo } from 'react';
import { MessageCircle } from 'lucide-react';
import { AccordionItem } from '../ui/Accordion';
import { FeedbackCategory } from '../../types';
import CategoryChip from './CategoryChip';
import ReviewList from './ReviewList';
import { useReviewsCache } from '../../hooks/useReviewsCache';

const PAGE_SIZE = 5; // number of reviews to show per "page"

interface FeedbackSectionProps {
  title: string;
  categories: FeedbackCategory[];
  type: 'complaint' | 'praise' | 'feature';
  defaultOpen?: boolean;
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({
  title,
  categories,
  type,
  defaultOpen = false
}) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  // Normalize and combine categories
  const normalizedCategories = useMemo(() => {
    const categoryMap = new Map<string, FeedbackCategory>();
    
    categories.forEach(category => {
      const normalizedName = category.subcategory.trim().toLowerCase();
      const existing = categoryMap.get(normalizedName);
      
      if (existing) {
        // Combine items and update count
        categoryMap.set(normalizedName, {
          subcategory: category.subcategory.trim(), // Keep original casing of first occurrence
          items: [...existing.items, ...category.items],
          count: existing.count + category.count
        });
      } else {
        categoryMap.set(normalizedName, {
          ...category,
          subcategory: category.subcategory.trim()
        });
      }
    });
    
    return Array.from(categoryMap.values());
  }, [categories]);
  
  // Get total count for current view
  const totalCount = useMemo(() => {
    if (activeCategory) {
      return normalizedCategories.find(
        c => c.subcategory.toLowerCase() === activeCategory.toLowerCase()
      )?.count || 0;
    }
    return normalizedCategories.reduce((sum, cat) => sum + cat.count, 0);
  }, [normalizedCategories, activeCategory]);
  
  const {
    items,
    isLoading,
    error,
    page,
    hasMore,
    sortOrder,
    loadMore,
    setSortOrder
  } = useReviewsCache({
    initialItems: activeCategory 
      ? normalizedCategories.find(c => c.subcategory.toLowerCase() === activeCategory.toLowerCase())?.items || []
      : normalizedCategories[0]?.items || [],
    pageSize: PAGE_SIZE,
    category: activeCategory || undefined,
    type,
    totalCount
  });
  
  // Header styles based on feedback type
  const headerStyles = {
    complaint: 'border-l-4 border-l-red-500 pl-4',
    praise: 'border-l-4 border-l-green-500 pl-4',
    feature: 'border-l-4 border-l-blue-500 pl-4'
  };
  
  // Icons for feedback type
  const headerIcons = {
    complaint: <MessageCircle className="h-5 w-5 text-red-500 mr-2" />,
    praise: <MessageCircle className="h-5 w-5 text-green-500 mr-2" />,
    feature: <MessageCircle className="h-5 w-5 text-blue-500 mr-2" />
  };
  
  return (
    <AccordionItem
      defaultOpen={defaultOpen}
      title={
        <div className={headerStyles[type]}>
          <div className="flex items-center">
            {headerIcons[type]}
            <h3 className="text-lg font-medium">{title}</h3>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {normalizedCategories.map((category) => (
            <CategoryChip
              key={category.subcategory.toLowerCase()}
              label={category.subcategory}
              count={category.count}
              type={type}
              active={activeCategory?.toLowerCase() === category.subcategory.toLowerCase()}
              onClick={() => setActiveCategory(
                activeCategory?.toLowerCase() === category.subcategory.toLowerCase() ? null : category.subcategory
              )}
              loading={isLoading}
            />
          ))}
        </div>

        {error && (
          <div className="text-red-500 text-center py-4">
            {error.message}
          </div>
        )}
        
        <div className="max-h-[600px] overflow-y-auto">
          <ReviewList
            items={items}
            type={type}
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={totalCount}
            isLoading={isLoading}
            sortOrder={sortOrder}
            onLoadMore={hasMore ? loadMore : undefined}
            onSortChange={setSortOrder}
          />
        </div>
      </div>
    </AccordionItem>
  );
};

export default FeedbackSection;