/**
 * Quick Action Card Component
 * Card component for quick access to common actions
 */

import { ChevronRight, LucideIcon } from 'lucide-react';
import React from 'react';

interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  onClick: () => void;
  badge?: {
    label: string;
    color?: 'primary' | 'success' | 'warning' | 'error';
  };
  disabled?: boolean;
  className?: string;
}

const badgeColors = {
  primary: 'bg-blue-100 text-blue-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
};

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon: Icon,
  title,
  description,
  onClick,
  badge,
  disabled = false,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`card group p-6 hover:shadow-lg transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
          <Icon className="w-6 h-6 text-primary-700" />
        </div>
        {badge && (
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badgeColors[badge.color || 'primary']}`}>
            {badge.label}
          </span>
        )}
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-600 mb-3">{description}</p>}

      <div className="flex items-center gap-2 text-primary-600 text-sm font-medium group-hover:gap-3 transition-all">
        <span>View</span>
        <ChevronRight className="w-4 h-4" />
      </div>
    </button>
  );
};

interface QuickActionGridProps {
  actions: Omit<QuickActionCardProps, 'className'>[];
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export const QuickActionGrid: React.FC<QuickActionGridProps> = ({
  actions,
  columns = 3,
  className = '',
}) => {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
  };

  return (
    <div className={`grid grid-cols-1 ${gridClass[columns]} gap-6 ${className}`}>
      {actions.map((action, index) => (
        <QuickActionCard key={index} {...action} />
      ))}
    </div>
  );
};

export default QuickActionCard;
