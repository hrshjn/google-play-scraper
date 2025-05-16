import React from 'react';
import { Check, X } from 'lucide-react';

interface PricingFeatureProps {
  feature: string;
  free: boolean | string;
  pro: boolean | string;
}

const PricingFeature: React.FC<PricingFeatureProps> = ({ feature, free, pro }) => {
  const renderValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-5 w-5 text-green-500" />
      ) : (
        <X className="h-5 w-5 text-gray-300" />
      );
    }
    
    return <span>{value}</span>;
  };
  
  return (
    <div className="grid grid-cols-3 py-3 border-b border-gray-200">
      <div className="col-span-1 text-sm text-gray-700">{feature}</div>
      <div className="flex justify-center items-center">{renderValue(free)}</div>
      <div className="flex justify-center items-center">{renderValue(pro)}</div>
    </div>
  );
};

export default PricingFeature;