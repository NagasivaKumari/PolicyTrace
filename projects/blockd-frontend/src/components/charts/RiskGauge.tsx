import React from 'react';
import { getRiskStrokeColor, getRiskLabel } from '../../utils/risk';

interface RiskGaugeProps {
  score: number;
  size?: number;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, size = 180 }) => {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const color = getRiskStrokeColor(score);
  const label = getRiskLabel(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background Circle */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-bg-elevated"
          />
          {/* Progress Circle */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-text-primary tracking-tighter">
            {Math.round(score)}
          </span>
          <span className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">
            Score
          </span>
        </div>
      </div>
      <div 
        className="mt-4 px-4 py-1.5 rounded-full border font-bold text-sm tracking-wide uppercase"
        style={{ color: color, borderColor: `${color}40`, backgroundColor: `${color}15` }}
      >
        {label}
      </div>
    </div>
  );
};
