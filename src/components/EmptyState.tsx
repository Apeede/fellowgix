/**
 * EmptyState Component
 * Displays a friendly message when no data is available
 */

import { LucideIcon } from 'lucide-react';
import React from 'react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`py-12 px-4 text-center ${className}`}>
      {Icon && (
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-gray-100 rounded-full">
            <Icon className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>

      {description && <p className="text-gray-600 mb-6 max-w-sm mx-auto">{description}</p>}

      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary inline-flex items-center gap-2"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

interface EmptyPageProps extends Omit<EmptyStateProps, 'className'> {
  fullPage?: boolean;
}

export const EmptyPage: React.FC<EmptyPageProps> = ({
  fullPage = true,
  ...props
}) => {
  return (
    <div className={fullPage ? 'min-h-screen flex items-center justify-center bg-gray-50' : ''}>
      <EmptyState {...props} className={fullPage ? '' : 'card'} />
    </div>
  );
};
