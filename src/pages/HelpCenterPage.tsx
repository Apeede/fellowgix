import { useAuth } from '@context/useAuth';
import { ArrowLeft, CalendarCheck2, ClipboardList, HelpCircle, QrCode, ShieldCheck, Users } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const HelpCenterPage: React.FC = () => {
  const { currentAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Help Center</h1>
              <p className="text-sm text-gray-600 mt-1">Product guidance for club admins and event teams</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="card bg-primary-50 border border-primary-100">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-5 h-5 text-primary-700" />
            <h2 className="text-lg font-semibold text-gray-900">Welcome, {currentAdmin?.name || 'Admin'}</h2>
          </div>
          <p className="text-sm text-gray-700">
            This system is now production-focused. Use this page to quickly train new admins and standardize club workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <CalendarCheck2 className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-gray-900">Event Workflow</h3>
            </div>
            <ol className="list-decimal ml-5 text-sm text-gray-700 space-y-1">
              <li>Create the event from Dashboard or Events page.</li>
              <li>Share QR for fast check-in at the venue.</li>
              <li>Track attendance live and review analytics afterward.</li>
            </ol>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-gray-900">Member + Guest Capture</h3>
            </div>
            <p className="text-sm text-gray-700">
              Capture members, club guests, and non-rotaractors with clean categories. This improves analytics quality and trend accuracy.
            </p>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <QrCode className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-gray-900">Check-in Best Practices</h3>
            </div>
            <ul className="list-disc ml-5 text-sm text-gray-700 space-y-1">
              <li>Keep one device on scanning and another for manual support.</li>
              <li>Download QR ahead of time for unstable internet venues.</li>
              <li>Use event-specific analytics right after each meeting.</li>
            </ul>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-gray-900">Admin Security</h3>
            </div>
            <p className="text-sm text-gray-700">
              Clubs can have up to 3 active admins. Keep roles minimal, rotate passwords regularly, and use the reset link from Settings when needed.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">Support Checklist</h3>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
            <li>Can admin sign in and access Dashboard?</li>
            <li>Can admin create and edit events?</li>
            <li>Is event analytics opening correctly?</li>
            <li>Are attendance records visible for recent events?</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default HelpCenterPage;
