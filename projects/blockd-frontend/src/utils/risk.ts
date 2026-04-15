import type { RiskLevel } from '../types';

export const getRiskLevel = (score: number): RiskLevel => {
  if (score <= 33) return 'low';
  if (score <= 66) return 'medium';
  return 'high';
};

export const getRiskColor = (score: number): string => {
  if (score <= 33) return 'text-green-400';
  if (score <= 66) return 'text-amber-400';
  return 'text-red-400';
};

export const getRiskBgColor = (score: number): string => {
  if (score <= 33) return 'bg-green-500/10 border-green-500/20';
  if (score <= 66) return 'bg-amber-400/10 border-amber-400/20';
  return 'bg-red-500/10 border-red-500/20';
};

export const getRiskLabel = (score: number): string => {
  if (score <= 33) return 'Low Risk';
  if (score <= 66) return 'Medium Risk';
  return 'High Risk';
};

export const getRiskStrokeColor = (score: number): string => {
  if (score <= 33) return '#34D399';
  if (score <= 66) return '#FBBF24';
  return '#F87171';
};
