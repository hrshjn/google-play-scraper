import React, { Fragment, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  showCloseButton?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  contentClassName,
  showCloseButton = true,
  size = 'md'
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Restore body scrolling when modal is closed
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);
  
  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };
  
  return (
    <Fragment>
      <div className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity" />
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <div
            ref={modalRef}
            className={twMerge(
              'w-full transform overflow-hidden rounded-lg bg-white p-6 text-left shadow-xl transition-all',
              sizeClasses[size],
              className
            )}
          >
            {(title || showCloseButton) && (
              <div className="flex justify-between items-center mb-4">
                {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
                {showCloseButton && (
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                    aria-label="Close modal"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}
            <div className={contentClassName}>{children}</div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default Modal;