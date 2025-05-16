import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
  className?: string;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 5000,
  onClose,
  className
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const typeStyles = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200'
  };

  useEffect(() => {
    if (duration === 0) return;
    
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) setTimeout(onClose, 300); // Allow animation to finish
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) setTimeout(onClose, 300); // Allow animation to finish
  };

  return (
    <div
      className={twMerge(
        'fixed top-4 right-4 z-50 flex items-center p-4 border rounded-lg shadow-lg transform transition-all duration-300',
        typeStyles[type],
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        className
      )}
      role="alert"
    >
      <div className="mr-3">{message}</div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 hover:bg-gray-200 focus:ring-2 focus:ring-gray-300"
        onClick={handleClose}
        aria-label="Close"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;