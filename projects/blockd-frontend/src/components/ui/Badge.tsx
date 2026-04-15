import React from 'react';
import { type LucideIcon } from 'lucide-react';

export type BadgeProps = {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'muted';
  size?: 'sm' | 'md';
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

const variantClasses: Record<string, string> = {
  success: 'bg-green-500/10 text-green-400 border border-green-500/20',
  warning: 'bg-amber-400/10 text-amber-400 border border-amber-400/20',
  danger: 'bg-red-500/10 text-red-400 border border-red-500/20',
  info: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  muted: 'bg-bg-elevated text-text-muted border border-border',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};
export const Badge: React.FC<BadgeProps> = ({
  variant = 'muted',
  size = 'md',
  icon: Icon,
  children,
  className = '',
  style = {},
}) => {
  const classes = `${variantClasses[variant]} ${sizeClasses[size]} rounded-full inline-flex items-center gap-1 ${className}`;
  return (
    <span className={classes} style={style}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
};
