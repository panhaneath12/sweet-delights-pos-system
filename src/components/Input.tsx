import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  helperText,
  className = '',
  ...props 
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 text-sm text-[var(--color-text-primary)]">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-3 rounded-lg border-2
          ${error ? 'border-[var(--color-error)]' : 'border-[var(--color-border)]'}
          focus:outline-none focus:border-[var(--color-primary)]
          transition-colors duration-200
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-[var(--color-error)]">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{helperText}</p>
      )}
    </div>
  );
};
