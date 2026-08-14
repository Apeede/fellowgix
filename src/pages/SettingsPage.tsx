import { useAuth } from '@context/useAuth';
import { authService } from '@services/firebase/auth-service';
import { clubService } from '@services/firebase/club-service';
import { ArrowLeft, Image, KeyRound, LifeBuoy, Save, Shield, Trash2, UserCircle2 } from 'lucide-react';
import React, { ChangeEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const SettingsPage: React.FC = () => {
  const { currentAdmin } = useAuth();
  const navigate = useNavigate();
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [organizationLogo, setOrganizationLogo] = useState('');
  const [clubLogo, setClubLogo] = useState('');
  const [eCardMessage, setECardMessage] = useState('');
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const canManageBranding = ['admin', 'club_admin', 'super_admin'].includes(currentAdmin?.role || '');

  useEffect(() => {
    if (!currentAdmin?.clubId) return;
    clubService.getClubById(currentAdmin.clubId).then((club) => {
      if (!club) return;
      setOrganizationLogo(club.organizationLogo || '');
      setClubLogo(club.clubLogo || '');
      setECardMessage(club.eCardMessage || '');
    }).catch(() => toast.error('Failed to load e-card branding'));
  }, [currentAdmin?.clubId]);

  const handleLogo = (setter: (value: string) => void) => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast.error('Please choose a PNG, JPG, or WebP image');
      return;
    }
    if (file.size > 250 * 1024) {
      toast.error('Logo must be 250 KB or smaller');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setter(String(reader.result || ''));
    reader.onerror = () => toast.error('Failed to read logo file');
    reader.readAsDataURL(file);
  };

  const handleSaveBranding = async () => {
    if (!currentAdmin?.clubId || !canManageBranding) return;
    setIsSavingBranding(true);
    try {
      await clubService.updateECardBranding(currentAdmin.clubId, {
        organizationLogo,
        clubLogo,
        eCardMessage,
      });
      toast.success('E-card branding saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save e-card branding');
    } finally {
      setIsSavingBranding(false);
    }
  };

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
          <div className="flex items-center gap-2 mb-2">
            <Image className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">E-Card Branding</h2>
          </div>
          <p className="text-sm text-gray-600 mb-5">
            Add logos and a message to the “Thank you for attending” card for your club’s events.
          </p>

          {canManageBranding ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { label: 'Rotary / Rotaract logo', value: organizationLogo, setValue: setOrganizationLogo },
                  { label: 'Club logo', value: clubLogo, setValue: setClubLogo },
                ].map(({ label, value, setValue }) => (
                  <div key={label} className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-900 mb-3">{label}</p>
                    <div className="h-28 bg-gray-50 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                      {value ? <img src={value} alt={`${label} preview`} className="max-h-24 max-w-full object-contain" /> : <span className="text-sm text-gray-400">No logo selected</span>}
                    </div>
                    <div className="flex gap-2">
                      <label className="btn-outline cursor-pointer text-sm">
                        Upload
                        <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={handleLogo(setValue)} />
                      </label>
                      {value && <button type="button" onClick={() => setValue('')} className="btn-outline text-sm inline-flex items-center gap-1"><Trash2 className="w-4 h-4" /> Remove</button>}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label htmlFor="ecard-message" className="block text-sm font-medium text-gray-900 mb-2">Custom thank-you message</label>
                <textarea id="ecard-message" rows={4} maxLength={350} value={eCardMessage} onChange={(event) => setECardMessage(event.target.value)} placeholder="Thank you for joining us..." className="input-field resize-y" />
                <p className="text-xs text-gray-500 mt-1">{eCardMessage.length}/350 characters. Leave blank to use the default message.</p>
              </div>

              <button type="button" onClick={handleSaveBranding} disabled={isSavingBranding} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
                <Save className="w-4 h-4" />
                {isSavingBranding ? 'Saving...' : 'Save E-Card Branding'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">Only club admins can change e-card branding.</p>
          )}
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
