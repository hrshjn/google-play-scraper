import React, { InputHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

interface InputGroupProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  endAdornment?: React.ReactNode;
}

const InputGroup: React.FC<InputGroupProps> = ({ 
  label,
  helperText,
  error,
  className,
  endAdornment,
  id,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          className={twMerge(
            "w-full px-4 py-2 border rounded-md transition-all duration-150 focus:ring-2 focus:outline-none",
            error 
              ? "border-red-300 focus:border-red-500 focus:ring-red-200" 
              : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-200",
            endAdornment ? "pr-12" : "",
            className
          )}
          {...props}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {endAdornment}
          </div>
        )}
      </div>
      {(helperText || error) && (
        <p className={`mt-1 text-sm ${error ? "text-red-600" : "text-gray-500"}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

export default InputGroup;