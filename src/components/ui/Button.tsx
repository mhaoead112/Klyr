import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
}) => {
  const baseClasses = 'font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95';
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary/50 shadow-lg hover:shadow-xl',
    secondary: 'bg-card-bg dark:bg-dark-surface text-dark-blue dark:text-white hover:bg-light-gray dark:hover:bg-dark-card focus:ring-primary/30',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary/50',
    danger: 'bg-error text-white hover:bg-red-600 focus:ring-error/50',
    glass: 'bg-white/10 dark:bg-white/10 backdrop-blur-md border border-white/20 text-primary dark:text-white hover:bg-white/20 focus:ring-white/30',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-body-sm',
    md: 'px-4 py-2 text-body',
    lg: 'px-6 py-3 text-body-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} flex items-center justify-center gap-2`}
    >
      {loading && <LoadingSpinner size="sm" color="text-current" />}
      {children}
    </button>
  );
};