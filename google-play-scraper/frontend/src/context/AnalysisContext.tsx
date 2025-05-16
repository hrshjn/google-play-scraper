import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react';
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
  const [status, setStatus] = useState<string>('idle');
  
  // Keeps the active setInterval ID so we can always clear it
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Handle status updates
  const updateFromStatus = async (data: any) => {
    setProgress(data);
    setError(null);
    
    // Check if analysis is complete
    if (
      data.progress >= 100 ||
      ['done', 'completed'].includes((data.status ?? '').toLowerCase())
    ) {
      try {
        console.log('Analysis complete, fetching results...'); // Debug log
        const results = await getAnalysisResult(jobId!);
        console.log('Got results:', results); // Debug log
        
        // Clear tip interval
        if (tipInterval) clearInterval(tipInterval);
        setTipInterval(null);
        
        // Set results and state
        setResult(results);
        setAnalysisState('done');
        // setStatus('completed'); // removed redundant status update
      } catch (error) {
        console.error('Failed to fetch results:', error);
        setError('Failed to fetch analysis results');
        setAnalysisState('error');
        setStatus('error');
        
        // Clear tip interval on error
        if (tipInterval) clearInterval(tipInterval);
        setTipInterval(null);
      }
    }
  };

  // Polling effect
  useEffect(() => {
    // If there's no job or the job is no longer "processing", stop polling
    if (!jobId || status !== "processing") {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    // Clear any previous interval (fixes duplicate timers on HMR)
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    // Start a fresh interval
    pollingRef.current = setInterval(async () => {
      try {
        const statusData = await getAnalysisStatus(jobId);
        setStatus(statusData.status ?? 'processing');
        updateFromStatus(statusData);
      } catch (err) {
        console.error("Polling failed", err);
      }
    }, 2000); // poll every 2 seconds

    // Clean up on unmount or when deps change
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [jobId, status]); // keep deps minimal

  // Reset analysis state
  const resetAnalysis = () => {
    setAnalysisState('idle');
    setProgress({ progress: 0, stage: 'Initializing...' });
    setResult(null);
    setError(null);
    setJobId(null);
    setStatus('idle');
    if (tipInterval) clearInterval(tipInterval);
    if (pollingRef.current) clearInterval(pollingRef.current);
    setTipInterval(null);
    pollingRef.current = null;
  };

  // Start analysis process
  const startAnalysis = async () => {
    try {
      resetAnalysis();
      setAnalysisState('loading');
      setStatus('processing');
      
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
      
    } catch (error) {
      console.error('Analysis process error:', error);
      setError('Failed to start analysis process');
      setAnalysisState('error');
      setStatus('error');
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