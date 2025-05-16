import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import PricingFeature from './PricingFeature';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  const handleUpgradeClick = () => {
    // In a real app, this would redirect to Stripe checkout
    alert('This would redirect to Stripe checkout in a production environment.');
    onClose();
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Choose Your Plan"
      size="lg"
    >
      <div className="mb-6">
        <p className="text-gray-600">
          Unlock powerful analytics and continuous monitoring with our Pro plan.
        </p>
      </div>
      
      <div className="grid grid-cols-3 mb-4">
        <div className="col-span-1"></div>
        <div className="text-center font-medium">Free</div>
        <div className="text-center font-medium">Pro</div>
      </div>
      
      <div className="mb-6">
        <PricingFeature 
          feature="Price" 
          free="$0" 
          pro="$19/mo" 
        />
        
        <PricingFeature 
          feature="App reports" 
          free="1 per day" 
          pro="Unlimited" 
        />
        
        <PricingFeature 
          feature="Report depth" 
          free="100 reviews" 
          pro="5,000 reviews" 
        />
        
        <PricingFeature 
          feature="Weekly monitoring" 
          free={false} 
          pro={true} 
        />
        
        <PricingFeature 
          feature="Trend analysis" 
          free={false} 
          pro={true} 
        />
        
        <PricingFeature 
          feature="Competitor comparison" 
          free={false} 
          pro={true} 
        />
        
        <PricingFeature 
          feature="Report PDF export" 
          free={true} 
          pro={true} 
        />
        
        <PricingFeature 
          feature="Data retention" 
          free="7 days" 
          pro="1 year" 
        />
        
        <PricingFeature 
          feature="Email reports" 
          free={false} 
          pro="Weekly" 
        />
      </div>
      
      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleUpgradeClick}>
          Upgrade to Pro
        </Button>
      </div>
    </Modal>
  );
};

export default PricingModal;