/**
 * Breadcrumbs Component
 * Displays navigation breadcrumbs for better UX
 */

import { ChevronRight, Home } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  const navigate = useNavigate();

  return (
    <nav className={`flex items-center gap-2 text-sm ${className}`} aria-label="Breadcrumb">
      <button
        onClick={() => navigate('/')}
        className="text-gray-500 hover:text-gray-700 transition-colors"
        title="Home"
      >
        <Home className="w-4 h-4" />
      </button>

      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-4 h-4 text-gray-400" />

          {item.path ? (
            <button
              onClick={() => navigate(item.path!)}
              className="text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ) : (
            <span className="text-gray-700 flex items-center gap-1">
              {item.icon}
              <span>{item.label}</span>
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
