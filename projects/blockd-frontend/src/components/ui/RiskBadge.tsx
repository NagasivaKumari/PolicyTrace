import React from 'react';
import { Badge } from './Badge';
import { getRiskLevel, getRiskColor, getRiskBgColor } from '../../utils/risk';

export type RiskBadgeProps = {
  score: number;
  size?: 'sm' | 'md';
};

export const RiskBadge: React.FC<RiskBadgeProps> = ({ score, size = 'sm' }) => {
  const level = getRiskLevel(score);
  const color = getRiskColor(score);
  const bg = getRiskBgColor(score);
  const label = `${level.toUpperCase()} RISK`;
  return (
    <Badge
      variant="muted"
      size={size}
      // custom inline styles for dynamic colors
      style={{ backgroundColor: bg, color, borderColor: color }}
    >
      {label}
    </Badge>
  );
};
