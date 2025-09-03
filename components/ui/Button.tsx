import React from 'react';
import { ButtonProps } from '@/types';

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
  type = 'button',
  className = '',
}) => {
  const baseClasses = 'btn inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'btn-primary focus:ring-blue-500',
    secondary: 'btn-secondary focus:ring-gray-500',
    accent: 'btn-accent focus:ring-teal-500',
    danger: 'btn-danger focus:ring-red-500',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  const disabledClasses = disabled || loading ? 'opacity-60 cursor-not-allowed' : '';
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`.trim();

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <div className="flex items-center">
          <div className="loading-spinner w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
};
