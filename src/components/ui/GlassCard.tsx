import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  blur?: 'sm' | 'md' | 'lg';
  opacity?: 'low' | 'medium' | 'high';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  blur = 'md',
  opacity = 'medium',
}) => {
  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
  };

  const opacityClasses = {
    low: 'bg-white/5 dark:bg-white/5',
    medium: 'bg-white/10 dark:bg-white/10',
    high: 'bg-white/20 dark:bg-white/20',
  };

  return (
    <div
      className={`
        ${opacityClasses[opacity]}
        ${blurClasses[blur]}
        border border-white/20 dark:border-white/10
        rounded-2xl
        shadow-xl
        transition-all duration-300
        hover:bg-white/15 dark:hover:bg-white/15
        ${className}
      `}
    >
      {children}
    </div>
  );
};