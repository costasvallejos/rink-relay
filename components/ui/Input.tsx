import React from 'react';
import { InputProps } from '@/types';

export const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder = '',
  value,
  onChange,
  disabled = false,
  error = '',
  label = '',
  required = false,
  className = '',
}) => {
  const baseClasses = 'input';
  const errorClasses = error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : '';
  const disabledClasses = disabled ? 'opacity-60 cursor-not-allowed' : '';
  
  const inputClasses = `${baseClasses} ${errorClasses} ${disabledClasses} ${className}`.trim();

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        className={inputClasses}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
