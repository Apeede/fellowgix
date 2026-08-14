import ErrorBoundary from '@components/ErrorBoundary';
import ProtectedRoute from '@components/ProtectedRoute';
import { AuthProvider } from '@context/AuthContext';
import DashboardPage from '@pages/DashboardPage';
import React, { Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { Navigate, Route, BrowserRouter as Router, Routes, useParams } from 'react-router-dom';
import './index.css';

const CHUNK_RELOAD_KEY = 'fellowgix-chunk-reload';

function lazyWithReload<T extends React.ComponentType<object>>(
  importer: () => Promise<{ default: T }>
) {
  return React.lazy(async () => {
    try {
      const module = await importer();
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      return module;
    } catch (error) {
      if (!sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, 'true');
        window.location.reload();
        return new Promise<{ default: T }>(() => undefined);
      }
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      throw error;
    }
  });
}

const SuperAdminPage = lazyWithReload(() => import('@pages/SuperAdminPage'));
const AdminInitPage = lazyWithReload(() => import('@pages/AdminInitPage'));
const CreateEventPage = lazyWithReload(() => import('@pages/CreateEventPage'));
const ECardPage = lazyWithReload(() => import('@pages/ECardPage'));
const EventCheckInPage = lazyWithReload(() => import('@pages/EventCheckInPage'));
const EventQRCodePage = lazyWithReload(() => import('@pages/EventQRCodePage'));
const EventsPage = lazyWithReload(() => import('@pages/EventsPage'));
const GuestCheckInPage = lazyWithReload(() => import('@pages/GuestCheckInPage'));
const LoginPage = lazyWithReload(() => import('@pages/LoginPage'));
const MemberCheckInPage = lazyWithReload(() => import('@pages/MemberCheckInPage'));
const MembersPage = lazyWithReload(() => import('@pages/MembersPage'));
const ScannerPage = lazyWithReload(() => import('@pages/ScannerPage'));
const EventAnalyticsPage = lazyWithReload(() => import('@pages/EventAnalyticsPage'));
const AttendanceListPage = lazyWithReload(() => import('@pages/AttendanceListPage'));
const ClubAnalyticsPage = lazyWithReload(() => import('@pages/ClubAnalyticsPage'));
const SystemAnalyticsPage = lazyWithReload(() => import('@pages/SystemAnalyticsPage'));
const SettingsPage = lazyWithReload(() => import('@pages/SettingsPage'));
const HelpCenterPage = lazyWithReload(() => import('@pages/HelpCenterPage'));
const EditEventPage = lazyWithReload(() => import('@pages/EditEventPage'));

const PublicQRCodeRedirect: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  return <Navigate to={eventId ? `/events/${eventId}/checkin` : '/scan'} replace />;
};

function App() {
  const withSuspense = (node: React.ReactNode) => (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      }
    >
      {node}
    </Suspense>
  );

  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={withSuspense(<LoginPage />)} />
          <Route path="/admin-init" element={withSuspense(<AdminInitPage />)} />
          <Route path="/scan" element={withSuspense(<ScannerPage />)} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/members"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'club_admin']}>
                {withSuspense(<MembersPage />)}
              </ProtectedRoute>
            }
          />

          <Route
            path="/super-admin"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                {withSuspense(<SuperAdminPage />)}
              </ProtectedRoute>
            }
          />

          {/* Event Management Routes */}
          <Route
            path="/events"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'club_admin', 'event_manager', 'viewer']}>
                {withSuspense(<EventsPage />)}
              </ProtectedRoute>
            }
          />

          <Route
            path="/events/create"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'club_admin', 'event_manager']}>
                {withSuspense(<CreateEventPage />)}
              </ProtectedRoute>
            }
          />

          <Route
            path="/events/:eventId/edit"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'club_admin', 'event_manager']}>
                {withSuspense(<EditEventPage />)}
              </ProtectedRoute>
            }
          />

          <Route
            path="/events/:eventId/manage-qrcode"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'club_admin', 'event_manager', 'viewer']}>
                {withSuspense(<EventQRCodePage />)}
              </ProtectedRoute>
            }
          />

          <Route
            path="/events/:eventId/qrcode"
            element={<PublicQRCodeRedirect />}
          />

          {/* Check-In Routes */}
          <Route
            path="/events/:eventId/checkin"
            element={withSuspense(<EventCheckInPage />)}
          />

          <Route
            path="/events/:eventId/checkin/member"
            element={withSuspense(<MemberCheckInPage />)}
          />

          <Route
            path="/events/:eventId/checkin/guest"
            element={withSuspense(<GuestCheckInPage />)}
          />

          {/* E-Card Route */}
          <Route
            path="/events/:eventId/ecard"
            element={withSuspense(<ECardPage />)}
          />

          {/* Analytics Routes */}
          <Route
            path="/events/:eventId/analytics"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'club_admin', 'event_manager', 'viewer']}>
                {withSuspense(<EventAnalyticsPage />)}
              </ProtectedRoute>
            }
          />

          <Route
            path="/events/:eventId/attendance"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'club_admin', 'event_manager', 'viewer']}>
                {withSuspense(<AttendanceListPage />)}
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics/club"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'club_admin', 'event_manager', 'viewer']}>
                {withSuspense(<ClubAnalyticsPage />)}
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics/system"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                {withSuspense(<SystemAnalyticsPage />)}
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                {withSuspense(<SettingsPage />)}
              </ProtectedRoute>
            }
          />

          <Route
            path="/help"
            element={
              <ProtectedRoute>
                {withSuspense(<HelpCenterPage />)}
              </ProtectedRoute>
            }
          />

          {/* Default Routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              style: {
                background: '#10b981',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#10b981',
              },
            },
            error: {
              duration: 3000,
              style: {
                background: '#ef4444',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#ef4444',
              },
            },
          }}
        />
      </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
