import React from 'react';

export type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
  color?: 'purple' | 'white' | 'green';
};

const sizeMap: Record<string, string> = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

const colorMap: Record<string, string> = {
  purple: 'border-purple-600',
  white: 'border-white',
  green: 'border-green-500',
};

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color = 'purple' }) => (
  <div className={`animate-spin rounded-full border-2 ${sizeMap[size]} ${colorMap[color]} border-t-transparent`} />
);
