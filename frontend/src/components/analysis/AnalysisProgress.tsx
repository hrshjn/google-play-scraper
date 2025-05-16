import React from 'react';
import ProgressBar from '../ui/ProgressBar';
import { useAnalysis } from '../../context/AnalysisContext';
import Modal from '../ui/Modal';

const AnalysisProgress: React.FC = () => {
  const { analysisState, progress, currentTip, resetAnalysis } = useAnalysis();
  
  const getStepStatus = (step: number) => {
    if (progress.progress < step * 33) return 'pending';
    if (progress.progress >= step * 33 && progress.progress < (step + 1) * 33) return 'active';
    return 'completed';
  };
  
  return (
    <Modal
      isOpen={analysisState === 'loading'}
      onClose={resetAnalysis}
      title="Analyzing App"
      size="md"
      contentClassName="space-y-6"
    >
      <div className="space-y-6">
        <ProgressBar 
          progress={progress.progress} 
          showPercentage 
        />
        
        <div className="py-2">
          <p className="text-lg font-medium text-gray-900">{progress.stage}</p>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
              getStepStatus(0) === 'completed' 
                ? 'bg-green-100 text-green-600' 
                : getStepStatus(0) === 'active'
                ? 'bg-indigo-100 text-indigo-600 animate-pulse' 
                : 'bg-gray-100 text-gray-400'
            }`}>
              {getStepStatus(0) === 'completed' ? '✓' : '1'}
            </div>
            <div className="ml-4">
              <p className={`text-sm ${
                getStepStatus(0) === 'completed' 
                  ? 'text-green-600 font-medium' 
                  : getStepStatus(0) === 'active'
                  ? 'text-indigo-600 font-medium' 
                  : 'text-gray-500'
              }`}>
                Preparing analysis
              </p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
              getStepStatus(1) === 'completed' 
                ? 'bg-green-100 text-green-600' 
                : getStepStatus(1) === 'active'
                ? 'bg-indigo-100 text-indigo-600 animate-pulse' 
                : 'bg-gray-100 text-gray-400'
            }`}>
              {getStepStatus(1) === 'completed' ? '✓' : '2'}
            </div>
            <div className="ml-4">
              <p className={`text-sm ${
                getStepStatus(1) === 'completed' 
                  ? 'text-green-600 font-medium' 
                  : getStepStatus(1) === 'active'
                  ? 'text-indigo-600 font-medium' 
                  : 'text-gray-500'
              }`}>
                Scraping reviews
              </p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
              getStepStatus(2) === 'completed' 
                ? 'bg-green-100 text-green-600' 
                : getStepStatus(2) === 'active'
                ? 'bg-indigo-100 text-indigo-600 animate-pulse' 
                : 'bg-gray-100 text-gray-400'
            }`}>
              {getStepStatus(2) === 'completed' ? '✓' : '3'}
            </div>
            <div className="ml-4">
              <p className={`text-sm ${
                getStepStatus(2) === 'completed' 
                  ? 'text-green-600 font-medium' 
                  : getStepStatus(2) === 'active'
                  ? 'text-indigo-600 font-medium' 
                  : 'text-gray-500'
              }`}>
                Generating insights
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 italic">"{currentTip}"</p>
        </div>
      </div>
    </Modal>
  );
};

export default AnalysisProgress;