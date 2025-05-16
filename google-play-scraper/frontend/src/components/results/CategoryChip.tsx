import React from 'react';
import { SubCategory } from '../../types';

interface CategoryChipProps {
  label: SubCategory;
  count: number;
  confidence?: number;
  type: 'complaint' | 'praise' | 'feature';
  active: boolean;
  onClick: () => void;
}

const CategoryChip: React.FC<CategoryChipProps> = ({
  label,
  count,
  confidence,
  type,
  active,
  onClick
}) => {
  const baseStyles = "px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2 cursor-pointer transition-colors";
  
  const typeStyles = {
    complaint: active ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800 hover:bg-red-50',
    praise: active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800 hover:bg-green-50',
    feature: active ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800 hover:bg-blue-50'
  };
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-700';
    if (confidence >= 0.6) return 'text-yellow-700';
    return 'text-red-700';
  };
  
  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${typeStyles[type]}`}
    >
      <span>{label}</span>
      <span className="bg-white bg-opacity-50 px-2 py-0.5 rounded-full text-xs">
        {count}
      </span>
      {confidence && (
        <span className={`text-xs font-normal ${getConfidenceColor(confidence)}`}>
          {Math.round(confidence * 100)}%
        </span>
      )}
    </button>
  );
};

export default CategoryChip;