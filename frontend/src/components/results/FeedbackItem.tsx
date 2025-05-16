import React from 'react';
import { MessageCircle } from 'lucide-react';
import { FeedbackItem as FeedbackItemType } from '../../types';

interface FeedbackItemProps {
  item: FeedbackItemType;
  type: 'complaint' | 'praise' | 'feature';
}

const FeedbackItem: React.FC<FeedbackItemProps> = ({ item, type }) => {
  const typeColors = {
    complaint: 'text-red-500',
    praise: 'text-green-500',
    feature: 'text-blue-500'
  };
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <div className="py-4">
      <div className="flex items-start space-x-3">
        <MessageCircle className={`h-5 w-5 mt-1 ${typeColors[type]}`} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">{item.summary}</h4>
            {item.confidence && (
              <span className={`text-sm font-medium ${getConfidenceColor(item.confidence)}`}>
                {Math.round(item.confidence * 100)}% confidence
              </span>
            )}
          </div>
          <p className="mt-1 text-gray-600">{item.quote}</p>
        </div>
      </div>
    </div>
  );
};

export default FeedbackItem;