import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  id: number;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  status: 'pending' | 'success' | 'error' | 'loading';
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  status,
}) => {
  return (
    <div className="flex items-center justify-between w-full">
      {steps.map((step, idx) => {
        const isCompleted = step.id < currentStep;
        const isActive = step.id === currentStep;
        
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center border-2
                transition-all duration-300
                ${isCompleted ? 'bg-purple-600 border-purple-600 text-white' : 
                  isActive ? 'bg-purple-600/10 border-purple-500 text-purple-500' : 
                  'bg-bg-elevated border-border text-text-muted'}
              `}>
                {isCompleted ? <Check size={20} /> : <span className="font-bold">{step.id}</span>}
              </div>
              <span className={`
                mt-2 text-xs font-semibold
                ${isActive ? 'text-purple-400' : isCompleted ? 'text-text-secondary' : 'text-text-muted'}
              `}>
                {step.label}
              </span>
            </div>
            
            {idx < steps.length - 1 && (
              <div className={`
                flex-grow h-0.5 mx-4 -mt-6
                ${step.id < currentStep ? 'bg-purple-600' : 'bg-border'}
              `} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
