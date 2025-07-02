import React from 'react';

interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  icon?: React.ReactNode;
  min?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  className = '',
  icon,
  min,
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-body-sm font-medium text-dark-blue dark:text-white mb-2">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-placeholder">
            {icon}
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          min={min}
          className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3 
            bg-white/10 dark:bg-white/5 
            backdrop-blur-md 
            border border-white/20 dark:border-white/10 
            rounded-xl 
            text-dark-blue dark:text-white 
            placeholder-placeholder 
            focus:outline-none 
            focus:ring-2 
            focus:ring-primary/50 
            focus:border-primary/50 
            transition-all duration-200
            ${error 
              ? 'border-error/50 bg-error/5' 
              : 'hover:border-white/30 dark:hover:border-white/20'
            } 
            disabled:opacity-50 disabled:cursor-not-allowed`}
        />
      </div>
      {error && (
        <p className="text-caption text-error mt-1">{error}</p>
      )}
    </div>
  );
};