import { AnalyticsService, AttendanceAnalytics } from '@services/firebase/analytics-service';
import { eventService } from '@services/firebase/event-service';
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    Eye,
    Loader,
    MapPin,
    TrendingUp,
    UserCheck,
    User as UserIcon,
    Users
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

const EventAnalyticsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Record<string, unknown> | null>(null);
  const [analytics, setAnalytics] = useState<AttendanceAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      loadData();
    }
  }, [eventId, loadData]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Load event details
      const eventData = await eventService.getEventById(eventId!);
      if (!eventData) {
        toast.error('Event not found');
        navigate('/events', { replace: true });
        return;
      }
      setEvent(eventData);

      // Load analytics
      const analyticsData = await AnalyticsService.getEventAnalytics(eventId!);
      setAnalytics(analyticsData);
    } catch (error) {
      toast.error('Failed to load analytics');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [eventId, navigate]);

  const handleViewAttendees = () => {
    navigate(`/events/${eventId}/attendance`, { replace: false });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!event || !analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card text-center">
          <p className="text-gray-600">Failed to load analytics data</p>
          <button
            type="button"
            onClick={() => navigate('/events', { replace: true })}
            className="btn-secondary mt-6"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const eventDateStr = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Find peak hour
  const hours = Object.entries(analytics.checkInByHour);
  const peakHour =
    hours.length > 0
      ? hours.reduce((max, current) => (current[1] > max[1] ? current : max))[0]
      : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="Go back"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
                <p className="text-gray-600 mt-1">Event Analytics & Insights</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleViewAttendees}
              className="btn-primary flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View Full List
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Event Details Card */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Event Details</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Calendar className="w-5 h-5" />
                  <span className="font-medium">Date</span>
                </div>
                <p className="text-lg text-gray-900">{eventDateStr}</p>
              </div>
              {event.location && (
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <MapPin className="w-5 h-5" />
                    <span className="font-medium">Location</span>
                  </div>
                  <p className="text-lg text-gray-900">{event.location}</p>
                </div>
              )}
              {event.speaker && (
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <UserIcon className="w-5 h-5" />
                    <span className="font-medium">Speaker</span>
                  </div>
                  <p className="text-lg text-gray-900">{event.speaker}</p>
                </div>
              )}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="card bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Total Attendees</p>
                  <p className="text-4xl font-bold text-gray-900">
                    {analytics.totalAttendees}
                  </p>
                </div>
                <Users className="w-12 h-12 text-blue-200" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Members</p>
                  <p className="text-4xl font-bold text-gray-900">
                    {analytics.memberCount}
                  </p>
                </div>
                <UserCheck className="w-12 h-12 text-green-200" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Guests</p>
                  <p className="text-4xl font-bold text-gray-900">{analytics.guestCount}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-purple-200" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-orange-50 to-red-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Duplicates</p>
                  <p className="text-4xl font-bold text-gray-900">
                    {analytics.duplicateCheckInCount}
                  </p>
                </div>
                <AlertCircle className="w-12 h-12 text-orange-200" />
              </div>
            </div>
          </div>

          {/* Additional Statistics */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Returning Guests */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Guest Status</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Returning Guests</span>
                    <span className="font-bold text-gray-900">
                      {analytics.returningGuestCount}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{
                        width: `${
                          analytics.guestCount > 0
                            ? (analytics.returningGuestCount / analytics.guestCount) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {analytics.guestCount > 0
                    ? `${((analytics.returningGuestCount / analytics.guestCount) * 100).toFixed(1)}% of guests are returning`
                    : 'No guests yet'}
                </p>
              </div>
            </div>

            {/* Guest Type Breakdown */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Guest Breakdown</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Rotarians</span>
                  <span className="font-bold text-gray-900">
                    {analytics.guestTypeBreakdown.rotarian}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Rotaractors</span>
                  <span className="font-bold text-gray-900">
                    {analytics.guestTypeBreakdown.rotaractor}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Non-Members</span>
                  <span className="font-bold text-gray-900">
                    {analytics.guestTypeBreakdown.non_rotaractor}
                  </span>
                </div>
              </div>
            </div>

            {/* Peak Hours */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Peak Check-in Time</h3>
              {peakHour !== null && (
                <div>
                  <p className="text-3xl font-bold text-primary-600 mb-2">{peakHour}:00</p>
                  <p className="text-sm text-gray-600">
                    {analytics.checkInByHour[parseInt(peakHour)]} check-ins at peak hour
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Based on check-in timestamp analysis
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Check-in Timeline */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Check-in Timeline</h3>
            <div className="space-y-2">
              {Object.entries(analytics.checkInByHour)
                .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                .map(([hour, count]) => (
                  <div key={hour} className="flex items-center gap-4">
                    <div className="w-12 text-right text-sm font-medium text-gray-600">
                      {hour}:00
                    </div>
                    <div className="flex-1 bg-gray-200 h-8 rounded-lg flex items-center">
                      <div
                        className="bg-primary-500 h-8 rounded-lg flex items-center justify-end pr-3 text-white text-sm font-bold"
                        style={{
                          width: `${
                            (count / Math.max(...Object.values(analytics.checkInByHour))) *
                            100
                          }%`,
                        }}
                      >
                        {count > 0 && count}
                      </div>
                    </div>
                    <div className="w-12 text-left text-sm text-gray-600">{count}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EventAnalyticsPage;
