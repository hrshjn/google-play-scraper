import { AnalysisProgress, AnalysisResult } from '../types';

const API_BASE_URL = 'http://localhost:5001/api';  // Backend runs on port 5001

// Simulated API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Submit a new analysis job
export const analyzeApp = async (appUrl: string): Promise<{ jobId: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ appUrl }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to start analysis (${response.status})`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Analysis request failed:', error);
    throw error;
  }
};

// Check the status of an analysis job
export const getAnalysisStatus = async (jobId: string): Promise<AnalysisProgress> => {
  try {
    const response = await fetch(`${API_BASE_URL}/status/${jobId}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to get analysis status (${response.status})`);
    }
    
    const data = await response.json();
    console.log('Raw status response:', data); // Debug log
    
    return {
      progress: data.progress || 0,
      stage: data.stage || 'Processing...',
      status: data.status
    };
  } catch (error) {
    console.error('Status check failed:', error);
    throw error;
  }
};

// Get the analysis results
export const getAnalysisResult = async (jobId: string): Promise<AnalysisResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/results/${jobId}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to get analysis results (${response.status})`);
    }
    
    const data = await response.json();
    console.log('Raw results response:', data); // Debug log
    
    if (!data || !data.app) {
      throw new Error('Invalid results format received');
    }
    
    return data;
  } catch (error) {
    console.error('Results fetch failed:', error);
    throw error;
  }
};