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
    console.log('Fetching results for job:', jobId); // Debug log
    const response = await fetch(`${API_BASE_URL}/results/${jobId}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to get analysis results (${response.status})`);
    }
    
    const data = await response.json();
    console.log('Raw results response:', data); // Debug log
    
    // Validate required fields
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid results format: data is not an object');
    }
    
    if (!data.app || typeof data.app !== 'object') {
      throw new Error('Invalid results format: missing or invalid app info');
    }
    
    if (!Array.isArray(data.complaints)) {
      throw new Error('Invalid results format: complaints is not an array');
    }
    
    if (!Array.isArray(data.praise)) {
      throw new Error('Invalid results format: praise is not an array');
    }
    
    if (!Array.isArray(data.feature_requests)) {
      throw new Error('Invalid results format: feature_requests is not an array');
    }
    
    if (!data.kpi || typeof data.kpi !== 'object') {
      throw new Error('Invalid results format: missing or invalid KPI data');
    }
    
    const result = {
      app: data.app,
      kpi: data.kpi,
      complaints: data.complaints,
      praise: data.praise,
      feature_requests: data.feature_requests
    };
    
    console.log('Processed results:', result); // Debug log
    return result;
  } catch (error) {
    console.error('Results fetch failed:', error);
    throw error;
  }
};