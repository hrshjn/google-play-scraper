import React, { useState } from 'react';
import { FileText, ArrowRightLeft, Activity } from 'lucide-react';
import Button from '../ui/Button';
import PricingModal from '../pricing/PricingModal';

const ResultsSidebar: React.FC = () => {
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  
  const handleDownloadPdf = () => {
    // In a real app, this would generate and download a PDF
    alert('This would download a PDF in a production environment.');
  };
  
  const handleCompare = () => {
    // In a real app, this would start a new comparison flow
    alert('This would start a new comparison in a production environment.');
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
      <div className="space-y-4">
        <Button
          onClick={handleDownloadPdf}
          className="w-full justify-center"
          variant="outline"
        >
          <FileText className="h-4 w-4 mr-2" />
          Download full PDF
        </Button>
        
        <Button
          onClick={handleCompare}
          className="w-full justify-center"
          variant="outline"
        >
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          Run comparison
        </Button>
        
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mt-6">
          <div className="flex items-start">
            <Activity className="h-5 w-5 text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-indigo-800 text-sm">Track this app weekly</h4>
              <p className="text-indigo-600 text-xs mt-1">
                Get automatic reports and trend analysis every week.
              </p>
              <Button
                className="mt-3 w-full justify-center"
                size="sm"
                onClick={() => setIsPricingOpen(true)}
              >
                Upgrade for $19/mo
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
      />
    </div>
  );
};

export default ResultsSidebar;