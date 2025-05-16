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

  // Reset analysis state
  const resetAnalysis = () => {
    setAnalysisState('idle');
    setProgress({ progress: 0, stage: 'Initializing...' });
    setResult(null);
    setError(null);
    setJobId(null);
    if (tipInterval) clearInterval(tipInterval);
    setTipInterval(null);
  };

  // Start analysis process
  const startAnalysis = async () => {
    try {
      resetAnalysis();
      setAnalysisState('loading');
      
      // Rotate through tips during analysis
      const interval = setInterval(() => {
        setCurrentTip(prev => {
          const currentIndex = analysisTips.indexOf(prev);
          const nextIndex = (currentIndex + 1) % analysisTips.length;
          return analysisTips[nextIndex];
        });
      }, 5000);
      
      setTipInterval(interval);
      
      // Start analysis job
      const { jobId: newJobId } = await analyzeApp(appUrl);
      setJobId(newJobId);
      
      // Poll for updates
      const statusInterval = setInterval(async () => {
        if (!newJobId) return;
        
        try {
          const status = await getAnalysisStatus(newJobId);
          setProgress(status);
          
          if (status.progress >= 100) {
            clearInterval(statusInterval);
            // Fetch the results
            const results = await getAnalysisResult(newJobId);
            setResult(results);
            setAnalysisState('done');
            
            // Clear tip rotation
            if (tipInterval) clearInterval(tipInterval);
            setTipInterval(null);
          }
        } catch (error) {
          clearInterval(statusInterval);
          if (tipInterval) clearInterval(tipInterval);
          setTipInterval(null);
          setError('Error checking analysis status');
          setAnalysisState('error');
        }
      }, 1000);
      
    } catch (error) {
      setError('Failed to start analysis');
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