import React from 'react';
import { MessageCircle, ThumbsUp, ThumbsDown, Lightbulb } from 'lucide-react';
import KpiCard from './KpiCard';
import { KpiData } from '../../types';

interface KpiStripProps {
  data: KpiData;
}

const KpiStrip: React.FC<KpiStripProps> = ({ data }) => {
  // Calculate percentages
  const complaintsPercentage = Math.round((data.complaints / data.total) * 100);
  const praisePercentage = Math.round((data.praise / data.total) * 100);
  const featuresPercentage = Math.round((data.features / data.total) * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        title="Total Reviews"
        value={data.total.toLocaleString()}
        subtitle="Analyzed in this report"
        icon={<MessageCircle className="h-5 w-5 text-gray-600" />}
      />
      
      <KpiCard
        title="Complaints"
        value={`${complaintsPercentage}%`}
        subtitle={`${data.complaints.toLocaleString()} reviews`}
        icon={<ThumbsDown className="h-5 w-5 text-red-500" />}
        className="border-l-4 border-l-red-500"
      />
      
      <KpiCard
        title="Praise"
        value={`${praisePercentage}%`}
        subtitle={`${data.praise.toLocaleString()} reviews`}
        icon={<ThumbsUp className="h-5 w-5 text-green-500" />}
        className="border-l-4 border-l-green-500"
      />
      
      <KpiCard
        title="Feature Requests"
        value={`${featuresPercentage}%`}
        subtitle={`${data.features.toLocaleString()} reviews`}
        icon={<Lightbulb className="h-5 w-5 text-blue-500" />}
        className="border-l-4 border-l-blue-500"
      />
    </div>
  );
};

export default KpiStrip;