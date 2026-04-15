import React from 'react';

export type CardProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
};

const paddingClasses: Record<string, string> = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, padding = 'md' }) => {
  const base = `bg-bg-surface border border-border rounded-xl ${paddingClasses[padding]} ${className}`;
  return (
    <div 
      className={onClick ? `${base} cursor-pointer hover:border-hover transition-colors` : base} 
      onClick={onClick}
    >
      {children}
    </div>
  );
};
