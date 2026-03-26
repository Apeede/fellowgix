import ProtectedRoute from '@components/ProtectedRoute';
import { AuthProvider } from '@context/AuthContext';
import AdminInitPage from '@pages/AdminInitPage';
import AttendanceListPage from '@pages/AttendanceListPage';
import CreateEventPage from '@pages/CreateEventPage';
import DashboardPage from '@pages/DashboardPage';
import ECardPage from '@pages/ECardPage';
import EventAnalyticsPage from '@pages/EventAnalyticsPage';
import EventCheckInPage from '@pages/EventCheckInPage';
import EventQRCodePage from '@pages/EventQRCodePage';
import EventsPage from '@pages/EventsPage';
import GuestCheckInPage from '@pages/GuestCheckInPage';
import LoginPage from '@pages/LoginPage';
import MemberCheckInPage from '@pages/MemberCheckInPage';
import ScannerPage from '@pages/ScannerPage';
import { Toaster } from 'react-hot-toast';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './index.css';

function App() {
  return (
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

          {/* Event Management Routes */}
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <EventsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/events/create"
            element={
              <ProtectedRoute>
                <CreateEventPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/events/:eventId/qrcode"
            element={
              <ProtectedRoute>
                <EventQRCodePage />
              </ProtectedRoute>
            }
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
              <ProtectedRoute>
                <EventAnalyticsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/events/:eventId/attendance"
            element={
              <ProtectedRoute>
                <AttendanceListPage />
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
  );
}

export default App;
