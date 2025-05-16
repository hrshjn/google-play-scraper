import React from 'react';
import { Accordion } from '../ui/Accordion';
import KpiStrip from './KpiStrip';
import ResultsHeader from './ResultsHeader';
import ResultsSidebar from './ResultsSidebar';
import FeedbackSection from './FeedbackSection';
import { AnalysisResult } from '../../types';

interface ResultsDashboardProps {
  result: AnalysisResult;
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ result }) => {
  const { app, kpi, complaints, praise, feature_requests } = result;
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-screen-xl">
      <ResultsHeader appInfo={app} />
      
      <div className="mb-6">
        <KpiStrip data={kpi} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Accordion>
            <FeedbackSection
              title="Top Complaints"
              categories={complaints}
              type="complaint"
              defaultOpen={true}
            />
            
            <FeedbackSection
              title="Top Praise"
              categories={praise}
              type="praise"
              defaultOpen={true}
            />
            
            <FeedbackSection
              title="Feature Requests"
              categories={feature_requests}
              type="feature"
              defaultOpen={true}
            />
          </Accordion>
        </div>
        
        <div className="sticky top-6 self-start">
          <ResultsSidebar />
        </div>
      </div>
    </div>
  );
};

export default ResultsDashboard;