import React from 'react';
import { Button } from './Button';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode | {
    label: string;
    icon?: LucideIcon;
    onClick?: () => void;
  };
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, action }) => {
  const renderAction = () => {
    if (!action) return null;
    if (React.isValidElement(action)) return action;
    
    const actionObj = action as { label: string; icon?: LucideIcon; onClick?: () => void };
    return (
      <Button 
        variant="secondary" 
        icon={actionObj.icon} 
        onClick={actionObj.onClick}
      >
        {actionObj.label}
      </Button>
    );
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary tracking-tight italic uppercase">{title}</h1>
        {subtitle && <p className="text-text-secondary mt-1">{subtitle}</p>}
      </div>
      <div className="flex-shrink-0">{renderAction()}</div>
    </div>
  );
};
