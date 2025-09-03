import React from 'react';
import { CardProps } from '@/types';

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  elevated = false,
}) => {
  const baseClasses = 'card';
  const hoverClasses = hover ? 'hover:shadow-lg hover:-translate-y-1' : '';
  const elevatedClasses = elevated ? 'card-elevated' : '';
  
  const classes = `${baseClasses} ${hoverClasses} ${elevatedClasses} ${className}`.trim();

  return (
    <div className={classes}>
      {children}
    </div>
  );
};
