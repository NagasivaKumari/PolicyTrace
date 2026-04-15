import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`
          absolute z-50 px-2 py-1 text-xs font-medium text-white bg-bg-elevated 
          border border-border rounded whitespace-nowrap
          animate-in fade-in duration-200
          ${positions[position]}
        `}>
          {content}
          <div className={`
            absolute w-2 h-2 bg-bg-elevated border-b border-r border-border rotate-45
            ${position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' : ''}
            ${position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1 rotate-[225deg]' : ''}
            ${position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1 rotate-[-45deg]' : ''}
            ${position === 'right' ? 'right-full top-1/2 -translate-y-1/2 -mr-1 rotate-[135deg]' : ''}
          `} />
        </div>
      )}
    </div>
  );
};
