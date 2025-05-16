import React, { useState } from 'react';
import { Search } from 'lucide-react';
import InputGroup from '../ui/InputGroup';
import Button from '../ui/Button';
import { useAnalysis } from '../../context/AnalysisContext';

const Hero: React.FC = () => {
  const { appUrl, setAppUrl, startAnalysis } = useAnalysis();
  const [error, setError] = useState<string | null>(null);
  
  const handleAnalyze = () => {
    // Validate URL
    if (!appUrl) {
      setError('Please enter a Google Play Store URL');
      return;
    }
    
    // Simple regex for Google Play URL validation
    const isValidUrl = /play\.google\.com\/store\/apps\/details/.test(appUrl);
    
    if (!isValidUrl) {
      setError('Please enter a valid Google Play Store URL');
      return;
    }
    
    setError(null);
    startAnalysis();
  };
  
  return (
    <div className="bg-white py-12 sm:py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          What do users love—or hate—in your competitor's app?
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Paste any Google Play link. We'll mine the latest reviews and hand you a product-ready report.
        </p>
        
        <div className="mb-4">
          <InputGroup
            id="appUrl"
            placeholder="Eg: https://play.google.com/store/apps/details?id=com.whatsapp"
            value={appUrl}
            onChange={(e) => setAppUrl(e.target.value)}
            className="text-base py-3"
            error={error || undefined}
            endAdornment={<Search className="h-5 w-5 text-gray-400" />}
            aria-label="App URL"
          />
        </div>
        
        <Button 
          onClick={handleAnalyze} 
          disabled={!appUrl}
          className="py-3 px-8 text-base font-medium"
        >
          Analyse now
        </Button>
        
        <p className="text-xs text-gray-500 mt-4">
          First report free • ~60 sec
        </p>
      </div>
    </div>
  );
};

export default Hero;