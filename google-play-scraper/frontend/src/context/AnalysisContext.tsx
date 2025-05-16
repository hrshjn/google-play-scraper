import React, { createContext, useContext, useState, ReactNode } from 'react';
import { analyzeApp, getAnalysisStatus, getAnalysisResult } from '../api';
import { AnalysisState, AnalysisResult, AnalysisProgress } from '../types';
import { analysisTips } from '../utils/tips';

interface AnalysisContextType {
  analysisState: AnalysisState;
  appUrl: string;
  setAppUrl: (url: string) => void;
  progress: AnalysisProgress;
  result: AnalysisResult | null;
  error: string | null;
  startAnalysis: () => Promise<void>;
  currentTip: string;
  resetAnalysis: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export const AnalysisProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle');
  const [appUrl, setAppUrl] = useState<string>('');
  const [progress, setProgress] = useState<AnalysisProgress>({ progress: 0, stage: 'Initializing...' });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [currentTip, setCurrentTip] = useState<string>(analysisTips[0]);
  const [tipInterval, setTipInterval] = useState<NodeJS.Timeout | null>(null);
  const [statusInterval, setStatusInterval] = useState<NodeJS.Timeout | null>(null);

  // Cleanup intervals on unmount or when intervals change
  React.useEffect(() => {
    return () => {
      if (statusInterval) clearInterval(statusInterval);
      if (tipInterval) clearInterval(tipInterval);
    };
  }, [statusInterval, tipInterval]);

  // Reset analysis state
  const resetAnalysis = () => {
    setAnalysisState('idle');
    setProgress({ progress: 0, stage: 'Initializing...' });
    setResult(null);
    setError(null);
    setJobId(null);
    if (tipInterval) clearInterval(tipInterval);
    if (statusInterval) clearInterval(statusInterval);
    setTipInterval(null);
    setStatusInterval(null);
  };

  // Start analysis process
  const startAnalysis = async () => {
    try {
      // Clear any existing intervals first
      if (statusInterval) clearInterval(statusInterval);
      if (tipInterval) clearInterval(tipInterval);
      setStatusInterval(null);
      setTipInterval(null);
      
      resetAnalysis();
      setAnalysisState('loading');
      
      // Rotate through tips during analysis
      const newTipInterval = setInterval(() => {
        setCurrentTip(prev => {
          const currentIndex = analysisTips.indexOf(prev);
          const nextIndex = (currentIndex + 1) % analysisTips.length;
          return analysisTips[nextIndex];
        });
      }, 5000);
      
      setTipInterval(newTipInterval);
      
      // Start analysis job
      const { jobId: newJobId } = await analyzeApp(appUrl);
      setJobId(newJobId);
      setError(null);
      
      // Poll for updates
      const newStatusInterval = setInterval(async () => {
        if (!newJobId) {
          clearInterval(newStatusInterval);
          return;
        }
        
        try {
          const status = await getAnalysisStatus(newJobId);
          console.log('Status update:', status); // Debug log
          
          setProgress(status);
          setError(null);
          
          // Check if analysis is complete
          if (status.progress >= 100 || status.status === 'completed') {
            try {
              console.log('Analysis complete, fetching results...'); // Debug log
              const results = await getAnalysisResult(newJobId);
              console.log('Got results:', results); // Debug log
              
              // Clear intervals first
              clearInterval(newStatusInterval);
              clearInterval(newTipInterval);
              setTipInterval(null);
              setStatusInterval(null);
              
              // Then set results and state
              setResult(results);
              setAnalysisState('done');
              return; // Exit after setting results
            } catch (error) {
              console.error('Failed to fetch results:', error);
              setError('Failed to fetch analysis results');
              setAnalysisState('error');
              
              // Clear intervals on error
              clearInterval(newStatusInterval);
              clearInterval(newTipInterval);
              setTipInterval(null);
              setStatusInterval(null);
            }
          }
        } catch (error) {
          console.error('Status check error:', error);
          // Don't set error state immediately for transient failures
          if (error instanceof Error && error.message !== 'Failed to get analysis status') {
            clearInterval(newStatusInterval);
            clearInterval(newTipInterval);
            setTipInterval(null);
            setStatusInterval(null);
            setError(error instanceof Error ? error.message : 'Failed to check analysis status');
            setAnalysisState('error');
          }
        }
      }, 2000);
      
      setStatusInterval(newStatusInterval);
      
    } catch (error) {
      console.error('Analysis process error:', error);
      setError('Failed to start analysis process');
      setAnalysisState('error');
      if (tipInterval) clearInterval(tipInterval);
      setTipInterval(null);
    }
  };

  return (
    <AnalysisContext.Provider
      value={{
        analysisState,
        appUrl,
        setAppUrl,
        progress,
        result,
        error,
        startAnalysis,
        currentTip,
        resetAnalysis
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysis = (): AnalysisContextType => {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
};