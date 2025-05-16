import React from 'react';
import Badge from '../ui/Badge';
import { AppInfo } from '../../types';

interface ResultsHeaderProps {
  appInfo: AppInfo;
}

const ResultsHeader: React.FC<ResultsHeaderProps> = ({ appInfo }) => {
  const { name, icon, rating } = appInfo;
  
  // Format the rating for display
  const displayRating = rating.toFixed(1);
  
  // Determine rating color based on value
  const getRatingColor = () => {
    if (rating >= 4.0) return 'success';
    if (rating >= 3.0) return 'warning';
    return 'error';
  };
  
  return (
    <div className="flex items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <img 
        src={icon} 
        alt={`${name} icon`} 
        className="h-12 w-12 rounded-lg mr-4" 
      />
      
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{name}</h2>
        <div className="flex items-center mt-1">
          <Badge variant={getRatingColor()}>
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 mr-0.5">
                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
              </svg>
              {displayRating}
            </span>
          </Badge>
          <span className="text-xs text-gray-500 ml-2">Google Play Store Rating</span>
        </div>
      </div>
    </div>
  );
};

export default ResultsHeader;