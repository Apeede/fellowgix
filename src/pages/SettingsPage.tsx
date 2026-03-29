import { useAuth } from '@context/useAuth';
import { authService } from '@services/firebase/auth-service';
import { ArrowLeft, KeyRound, LifeBuoy, Shield, UserCircle2 } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const SettingsPage: React.FC = () => {
  const { currentAdmin } = useAuth();
  const navigate = useNavigate();
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleSendReset = async () => {
    if (!currentAdmin?.email) return;

    setIsSendingReset(true);
    try {
      await authService.sendAdminPasswordReset(currentAdmin.email);
      toast.success(`Password reset link sent to ${currentAdmin.email}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send password reset link');
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              aria-label="Back to dashboard"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your account and security preferences</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <UserCircle2 className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Account</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Name</p>
              <p className="font-medium text-gray-900">{currentAdmin?.name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{currentAdmin?.email || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-gray-500">Club</p>
              <p className="font-medium text-gray-900">{currentAdmin?.clubName || currentAdmin?.clubId || 'Unknown'}</p>
              <p className="text-xs text-gray-500 mt-1">
                {currentAdmin?.clubId || 'No club ID'}
                {currentAdmin?.clubCode ? ` • ${currentAdmin.clubCode}` : ''}
                {currentAdmin?.clubType ? ` • ${currentAdmin.clubType.toUpperCase()}` : ''}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Role</p>
              <p className="font-medium text-gray-900">{currentAdmin?.role || 'Unknown'}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Security</h2>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-amber-900">
              For security, password resets are sent to your registered admin email.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSendReset}
            disabled={isSendingReset}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
          >
            <KeyRound className="w-4 h-4" />
            {isSendingReset ? 'Sending reset link...' : 'Send Password Reset Link'}
          </button>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <LifeBuoy className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Need Help?</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Open the Help Center for setup guidance, feature walkthroughs, and troubleshooting tips.
          </p>
          <button type="button" onClick={() => navigate('/help')} className="btn-outline">
            Open Help Center
          </button>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
