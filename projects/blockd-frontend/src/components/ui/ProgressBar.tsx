import React from 'react';

interface ProgressBarProps {
  value: number;
  color?: 'purple' | 'green' | 'red' | 'amber';
  size?: 'sm' | 'md';
  showLabel?: boolean;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = 'purple',
  size = 'md',
  showLabel = false,
  animated = false,
}) => {
  const colors = {
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    amber: 'bg-amber-400',
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between mb-1.5 text-xs font-semibold text-text-secondary">
          <span>Progress</span>
          <span>{Math.round(value)}%</span>
        </div>
      )}
      <div className={`w-full bg-bg-elevated rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className={`h-full transition-all duration-500 ease-out ${colors[color]} ${animated ? 'animate-pulse' : ''}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}
;
