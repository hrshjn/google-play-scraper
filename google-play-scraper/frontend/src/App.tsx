import React from 'react';
import { AnalysisProvider } from './context/AnalysisContext';
import Navbar from './components/layout/Navbar';
import Hero from './components/landing/Hero';
import AnalysisProgress from './components/analysis/AnalysisProgress';
import ResultsDashboard from './components/results/ResultsDashboard';
import Toast from './components/ui/Toast';
import { useAnalysis } from './context/AnalysisContext';

function AppContent() {
  const { analysisState, result, error, resetAnalysis } = useAnalysis();
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      {analysisState === 'idle' && <Hero />}
      
      <AnalysisProgress />
      
      {analysisState === 'done' && result && (
        <ResultsDashboard result={result} />
      )}
      
      {error && (
        <Toast
          message={error}
          type="error"
          onClose={resetAnalysis}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AnalysisProvider>
      <AppContent />
    </AnalysisProvider>
  );
}

export default App;