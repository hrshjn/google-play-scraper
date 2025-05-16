import React, { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface AccordionItemProps {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  children,
  defaultOpen = false,
  className,
  titleClassName,
  contentClassName
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={twMerge("border border-gray-200 rounded-lg overflow-hidden", className)}>
      <button
        type="button"
        className={twMerge(
          "flex justify-between items-center w-full px-4 py-3 text-left bg-white hover:bg-gray-50 transition-colors",
          titleClassName
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div>{title}</div>
        <ChevronDown 
          className={`transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} 
          size={18} 
        />
      </button>
      <div
        className={`transition-all duration-200 overflow-hidden ${
          isOpen ? 'max-h-screen py-4 px-4' : 'max-h-0 py-0 px-4'
        } ${contentClassName}`}
      >
        {children}
      </div>
    </div>
  );
};

interface AccordionProps {
  children: ReactNode;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({ children, className }) => {
  return (
    <div className={twMerge("space-y-3", className)}>
      {children}
    </div>
  );
};