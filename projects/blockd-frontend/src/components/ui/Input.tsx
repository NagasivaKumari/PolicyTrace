import React, { useState } from 'react';
import { type LucideIcon } from 'lucide-react';

export type InputProps = {
  label?: string;
  placeholder?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  rightElement?: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  className?: string;
};

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  error,
  helperText,
  icon: Icon,
  rightElement,
  disabled = false,
  required = false,
  name,
  className = '',
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="flex flex-col space-y-1">
      {label && (
        <label className="text-text-secondary font-medium" htmlFor={name}>
          {label}{required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <Icon className="absolute left-3 text-text-muted" size={16} />
        )}
        <input
          id={name}
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`bg-bg-elevated border border-border focus:border-purple-500 rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted outline-none w-full ${Icon ? 'pl-10' : ''} ${error ? 'border-red-400' : ''} ${className}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-text-muted"
          >
            {showPassword ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.042.158-2.045.45-3.004M15 9h.01M9 9h.01M21 12c0 1.657-1.343 3-3 3h-1.5a1.5 1.5 0 01-1.5-1.5V12" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.042.158-2.045.45-3.004M15 9h.01M9 9h.01M21 12c0 1.657-1.343 3-3 3h-1.5a1.5 1.5 0 01-1.5-1.5V12" /></svg>}
          </button>
        )}
        {rightElement && <div className="absolute right-3">{rightElement}</div>}
      </div>
      {error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : helperText ? (
        <p className="text-text-muted text-sm">{helperText}</p>
      ) : null}
    </div>
  );
};
