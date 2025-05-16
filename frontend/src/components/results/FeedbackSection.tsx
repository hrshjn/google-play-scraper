import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { AccordionItem } from '../ui/Accordion';
import { FeedbackCategory } from '../../types';
import CategoryChip from './CategoryChip';
import FeedbackItem from './FeedbackItem';

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
  
  const filteredCategories = activeCategory
    ? categories.filter(cat => cat.subcategory === activeCategory)
    : categories;
  
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
          {categories.map((category) => (
            <CategoryChip
              key={category.subcategory}
              label={category.subcategory}
              count={category.count}
              type={type}
              active={activeCategory === category.subcategory}
              onClick={() => setActiveCategory(
                activeCategory === category.subcategory ? null : category.subcategory
              )}
            />
          ))}
        </div>
        
        <div className="divide-y divide-gray-100">
          {filteredCategories.map((category) => (
            <React.Fragment key={category.subcategory}>
              {category.items.map((item, index) => (
                <FeedbackItem
                  key={`${category.subcategory}-${index}`}
                  item={item}
                  type={type}
                />
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </AccordionItem>
  );
};

export default FeedbackSection;