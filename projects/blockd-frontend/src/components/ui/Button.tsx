import React from 'react';
import { type LucideIcon } from 'lucide-react';

export type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  title?: string;
  'aria-label'?: string;
};

const variantClasses: Record<string, string> = {
  primary: 'bg-purple-600 hover:bg-purple-500 text-white border border-transparent',
  secondary: 'border border-purple-500/30 hover:border-purple-500 hover:bg-purple-500/10 text-purple-400',
  danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30',
  ghost: 'hover:bg-white/5 text-text-secondary border border-transparent',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
}) => {
  const classes = `${variantClasses[variant]} ${sizeClasses[size]} rounded-lg flex items-center justify-center gap-2 ${fullWidth ? 'w-full' : ''} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`;
  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled || loading}>
      {loading ? (
        <span className="animate-spin border-2 border-white rounded-full w-4 h-4" />
      ) : (
        <> 
          {Icon && iconPosition === 'left' && <Icon size={16} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon size={16} />}
        </>
      )}
    </button>
  );
};
