import { AnalysisProgress, AnalysisResult } from '../types';

const API_BASE_URL = 'http://localhost:5001/api';  // Updated port to match backend

// Simulated API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Submit a new analysis job
export const analyzeApp = async (appUrl: string): Promise<{ jobId: string }> => {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ appUrl }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to start analysis');
  }
  
  return response.json();
};

// Check the status of an analysis job
export const getAnalysisStatus = async (jobId: string): Promise<AnalysisProgress & { result?: AnalysisResult }> => {
  const response = await fetch(`${API_BASE_URL}/status/${jobId}`);
  
  if (!response.ok) {
    throw new Error('Failed to get analysis status');
  }
  
  const data = await response.json();
  
  return {
    progress: data.progress,
    stage: data.stage,
    result: data.result,
  };
};

// Get the results of an analysis
export const getAnalysisResult = async (jobId: string): Promise<AnalysisResult> => {
  const response = await fetch(`${API_BASE_URL}/results/${jobId}`);
  
  if (!response.ok) {
    throw new Error('Failed to get analysis results');
  }
  
  return response.json();
};