import React from 'react';
import { twMerge } from 'tailwind-merge';

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  barClassName?: string;
  label?: string;
  showPercentage?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className,
  barClassName,
  label,
  showPercentage = false
}) => {
  // Ensure progress is between 0-100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className={twMerge("w-full", className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && <span className="text-sm text-gray-500">{Math.round(clampedProgress)}%</span>}
        </div>
      )}
      <div className="overflow-hidden h-2 bg-gray-200 rounded-full">
        <div 
          className={twMerge(
            "h-full bg-indigo-500 transition-all duration-300 ease-out rounded-full",
            barClassName
          )}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;