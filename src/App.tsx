import ErrorBoundary from '@components/ErrorBoundary';
import ProtectedRoute from '@components/ProtectedRoute';
import { AuthProvider } from '@context/AuthContext';
import AdminInitPage from '@pages/AdminInitPage';
import CreateEventPage from '@pages/CreateEventPage';
import DashboardPage from '@pages/DashboardPage';
import ECardPage from '@pages/ECardPage';
import EventCheckInPage from '@pages/EventCheckInPage';
import EventQRCodePage from '@pages/EventQRCodePage';
import EventsPage from '@pages/EventsPage';
import GuestCheckInPage from '@pages/GuestCheckInPage';
import LoginPage from '@pages/LoginPage';
import MemberCheckInPage from '@pages/MemberCheckInPage';
import MembersPage from '@pages/MembersPage';
import ScannerPage from '@pages/ScannerPage';
import React, { Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { Navigate, Route, BrowserRouter as Router, Routes, useParams } from 'react-router-dom';
import './index.css';

const SuperAdminPage = React.lazy(() => import('@pages/SuperAdminPage'));
const EventAnalyticsPage = React.lazy(() => import('@pages/EventAnalyticsPage'));
const AttendanceListPage = React.lazy(() => import('@pages/AttendanceListPage'));
const ClubAnalyticsPage = React.lazy(() => import('@pages/ClubAnalyticsPage'));
const SystemAnalyticsPage = React.lazy(() => import('@pages/SystemAnalyticsPage'));
const SettingsPage = React.lazy(() => import('@pages/SettingsPage'));
const HelpCenterPage = React.lazy(() => import('@pages/HelpCenterPage'));
const EditEventPage = React.lazy(() => import('@pages/EditEventPage'));

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
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin-init" element={<AdminInitPage />} />
          <Route path="/scan" element={<ScannerPage />} />

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
                <MembersPage />
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
                <EventsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/events/create"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'club_admin', 'event_manager']}>
                <CreateEventPage />
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
                <EventQRCodePage />
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
            element={<EventCheckInPage />}
          />

          <Route
            path="/events/:eventId/checkin/member"
            element={<MemberCheckInPage />}
          />

          <Route
            path="/events/:eventId/checkin/guest"
            element={<GuestCheckInPage />}
          />

          {/* E-Card Route */}
          <Route
            path="/events/:eventId/ecard"
            element={<ECardPage />}
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
