import React from 'react';
import { FileText } from 'lucide-react';
import Button from '../ui/Button';

const ResultsSidebar: React.FC = () => {
  const handleDownloadCsv = () => {
    // In a real app, this would generate and download a CSV
    alert('This would download a CSV in a production environment.');
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
      <div className="space-y-4">
        <Button
          onClick={handleDownloadCsv}
          className="w-full justify-center"
          variant="outline"
        >
          <FileText className="h-4 w-4 mr-2" />
          Download CSV
        </Button>
      </div>
    </div>
  );
};

export default ResultsSidebar;