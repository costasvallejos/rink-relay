import React from 'react';
import { Card } from '@/components/ui/Card';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
  className = '',
}) => {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 ${className}`}>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{title}</h1>
            {subtitle && (
              <p className="text-gray-600">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex gap-3">
              {actions}
            </div>
          )}
        </div>

        {children}
      </div>
    </div>
  );
};

interface SectionProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({
  children,
  title,
  className = '',
}) => {
  return (
    <Card className={`p-6 mb-8 ${className}`}>
      {title && (
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">{title}</h2>
      )}
      {children}
    </Card>
  );
};
