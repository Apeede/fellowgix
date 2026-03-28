import { useAuth } from '@context/useAuth';
import { eventService } from '@services/firebase/event-service';
import { EventStats } from '@types/event';
import { BarChart3, Calendar, LogOut, Plus, ShieldCheck, TrendingUp, UserCheck, Users } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { currentAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<EventStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const canManageMembers = currentAdmin?.role === 'club_admin' || currentAdmin?.role === 'super_admin';
  const canManageEvents =
    currentAdmin?.role === 'event_manager' || currentAdmin?.role === 'club_admin' || currentAdmin?.role === 'super_admin';

  const loadStats = useCallback(async () => {
    if (!currentAdmin) return;

    try {
      const data = await eventService.getEventStats(currentAdmin.id, currentAdmin.clubId);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentAdmin]);

  useEffect(() => {
    loadStats();
  }, [currentAdmin, loadStats]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error((error instanceof Error ? error.message : String(error)));
    }
  };

  const handleOpenAnalytics = async () => {
    if (!currentAdmin) return;

    try {
      // Prefer upcoming events, but fall back to any available active event.
      const upcomingEvents = await eventService.getUpcomingEvents(currentAdmin.id, currentAdmin.clubId);
      if (upcomingEvents.length > 0 && upcomingEvents[0].id) {
        navigate(`/events/${upcomingEvents[0].id}/analytics`);
        return;
      }

      const allEvents = await eventService.getEventsByAdmin(currentAdmin.id, true, currentAdmin.clubId);
      const activeEvent = allEvents.find((event) => event.isActive) || allEvents[0];

      if (activeEvent?.id) {
        navigate(`/events/${activeEvent.id}/analytics`);
        return;
      }

      toast.error('No events found yet. Create an event first.');
      navigate('/events');
    } catch (error) {
      toast.error('Failed to open analytics');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-7 h-7 sm:w-8 sm:h-8 text-primary-700" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Rotaract Attendance</h1>
            </div>
            <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">{currentAdmin?.name}</p>
                <p className="text-xs text-gray-500">{currentAdmin?.email}</p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="btn-outline flex items-center gap-2 py-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Welcome Section */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {currentAdmin?.name}!
          </h2>
          <p className="text-gray-600">Manage your Rotaract events and track attendance</p>
        </div>

        {/* Stats Grid */}
        {!isLoading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Total Events */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Events</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalEvents}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Active Events */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Active Events</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeEvents}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Upcoming Events</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.upcomingEvents}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Total Attendance */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Attendance</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.totalAttendance}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Event Management Card */}
          <div
            onClick={() => navigate('/events')}
            className="card cursor-pointer hover:shadow-lg hover:border-primary-600 transition-all border-2 border-transparent"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Manage Events</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Create, edit, and manage your events
                </p>
              </div>
              <Calendar className="w-8 h-8 text-primary-600" />
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button type="button" className="btn-primary flex items-center gap-2 w-full justify-center">
                <Plus className="w-4 h-4" />
                View Events
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (canManageEvents) navigate('/events/create');
                }}
                className="btn-outline flex items-center gap-2 w-full justify-center disabled:opacity-60"
                disabled={!canManageEvents}
              >
                <Plus className="w-4 h-4" />
                Create Event
              </button>
            </div>
          </div>

          {/* Members Card */}
          <div
            onClick={() => {
              if (canManageMembers) navigate('/members');
            }}
            className="card cursor-pointer hover:shadow-lg hover:border-primary-600 transition-all border-2 border-transparent"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Manage Members</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Add, view, and manage Rotaract members
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-primary-600" />
            </div>
            <button type="button" className="btn-primary mt-4 flex items-center gap-2 w-full justify-center">
              <Users className="w-4 h-4" />
              {canManageMembers ? 'View Members' : 'No Access'}
            </button>
          </div>

          {/* Analytics Card */}
          <div
            onClick={() => navigate('/analytics/club')}
            className="card cursor-pointer hover:shadow-lg hover:border-primary-600 transition-all border-2 border-transparent"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Analytics</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Club-level trends and event comparisons
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-primary-600" />
            </div>
            <button type="button" className="btn-primary mt-4 flex items-center gap-2 w-full justify-center">
              <BarChart3 className="w-4 h-4" />
              Club Analytics
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-12 card">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => {
                if (canManageMembers) navigate('/members');
              }}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">Manage Members</p>
                  <p className="text-sm text-gray-600">Add or view members</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                if (canManageEvents) navigate('/events/create');
              }}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">Create New Event</p>
                  <p className="text-sm text-gray-600">{canManageEvents ? 'Start a new event' : 'Role cannot create events'}</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate('/analytics/club')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">Club Analytics</p>
                  <p className="text-sm text-gray-600">See trends across all club events</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate('/events')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">View All Events</p>
                  <p className="text-sm text-gray-600">Manage your events</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={handleOpenAnalytics}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">View Analytics</p>
                  <p className="text-sm text-gray-600">Select an event to view insights</p>
                </div>
              </div>
            </button>

            {currentAdmin?.role === 'super_admin' && (
              <button
                type="button"
                onClick={() => navigate('/super-admin')}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="font-medium text-gray-900">Super Admin</p>
                    <p className="text-sm text-gray-600">Create admins for clubs</p>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
