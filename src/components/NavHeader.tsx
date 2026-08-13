/**
 * Navigation Header Component
 * Reusable header for authenticated pages
 */

import { useAuth } from '@context/useAuth';
import { BarChart3, LogOut } from 'lucide-react';
import React from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { BreadcrumbItem, Breadcrumbs } from './Breadcrumbs';

interface NavHeaderProps {
  title?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  showUserMenu?: boolean;
  onMobileMenuToggle?: (isOpen: boolean) => void;
}

export const NavHeader: React.FC<NavHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  actions,
  showUserMenu = true,
}) => {
  const { currentAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [showUserDropdown, setShowUserDropdown] = React.useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to logout');
    }
  };

  return (
    <>
      {/* Main Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Row - Logo and User Menu */}
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <BarChart3 className="w-8 h-8 text-primary-700" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">Rotaract</h1>
              </div>
            </div>

            {/* User Menu */}
            {showUserMenu && currentAdmin && (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{currentAdmin.name}</p>
                    <p className="text-xs text-gray-500">{currentAdmin.role.replace('_', ' ')}</p>
                  </div>
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {currentAdmin.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <button
                      onClick={() => navigate('/settings')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Settings
                    </button>
                    <button
                      onClick={() => navigate('/help')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-200 transition-colors"
                    >
                      Help Center
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-200 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Row - Breadcrumbs and Actions */}
          {(breadcrumbs || actions) && (
            <div className="flex items-center justify-between gap-4 py-3 border-t border-gray-200">
              <div className="flex-1 min-w-0">
                {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
              </div>
              {actions && <div className="flex-shrink-0">{actions}</div>}
            </div>
          )}
        </div>
      </nav>

      {/* Page Title Section */}
      {title && (
        <div className="bg-gray-50 border-b border-gray-200 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{title}</h1>
            {description && <p className="text-gray-600 mt-2 text-lg">{description}</p>}
          </div>
        </div>
      )}
    </>
  );
};

export default NavHeader;
