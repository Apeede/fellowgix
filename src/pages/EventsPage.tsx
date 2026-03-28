import { useAuth } from '@context/useAuth';
import { eventService } from '@services/firebase/event-service';
import { qrCodeGeneratorService } from '@services/qrcode/qrcode-generator';
import { Event } from '@types/event';
import {
    ArrowLeft,
    BarChart3,
    Calendar,
    Download,
    Edit,
    Loader,
    MapPin,
    Plus,
    QrCode,
    Trash2,
    User,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';

const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentAdmin } = useAuth();

  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming'>('upcoming');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    if (!currentAdmin) return;

    setIsLoading(true);
    try {
      let data: Event[] = [];
      if (filter === 'upcoming') {
        data = await eventService.getUpcomingEvents(currentAdmin.id, currentAdmin.clubId);
      } else {
        data = await eventService.getEventsByAdmin(currentAdmin.id, filter === 'all', currentAdmin.clubId);
      }
      setEvents(data);
    } catch (error) {
      toast.error('Failed to load events');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [currentAdmin, filter]);

  // Fetch events on mount and when filter changes
  useEffect(() => {
    loadEvents();
  }, [filter, loadEvents]);

  // Highlight new event if created
  useEffect(() => {
    const state = location.state as { newEventId?: string } | null;
    if (state?.newEventId) {
      setSelectedEventId(state.newEventId);
      setTimeout(() => setSelectedEventId(null), 3000);
    }
  }, [location.state]);

  const handleDownloadQR = async (event: Event) => {
    try {
      await qrCodeGeneratorService.downloadQRCode(event.qrCode, event.name);
      toast.success('QR Code downloaded!');
    } catch (error) {
      toast.error('Failed to download QR code');
      console.error(error);
    }
  };

  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${eventName}"?`)) {
      return;
    }

    try {
      await eventService.deleteEvent(eventId);
      setEvents(events.filter((e) => e.id !== eventId));
      toast.success('Event deleted successfully');
    } catch (error) {
      toast.error('Failed to delete event');
      console.error(error);
    }
  };

  const handleViewQR = (event: Event) => {
    navigate(`/events/${event.id}/qrcode`, { state: { event } });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                aria-label="Back to dashboard"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Events</h1>
            </div>
            <div className="flex w-full sm:w-auto items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn-outline flex-1 sm:flex-none"
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => navigate('/events/create')}
                className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Event
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto">
          <div className="flex gap-6 sm:gap-8 min-w-max">
            {(['upcoming', 'active', 'all'] as const).map((tab) => (
              <button
                type="button"
                key={tab}
                onClick={() => setFilter(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  filter === tab
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab} Events
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading events...</p>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="card text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'upcoming'
                ? 'Create your first event to get started'
                : 'No events match the selected filter'}
            </p>
            {filter === 'upcoming' && (
              <button
                type="button"
                onClick={() => navigate('/events/create')}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Event
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className={`card transition-all ${
                  selectedEventId === event.id ? 'ring-2 ring-green-500 shadow-lg' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left: Event Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{event.name}</h3>
                        <p className="text-gray-600 text-sm mt-1">{event.theme}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          event.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {event.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(event.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}{' '}
                        {event.time && `• ${event.time}`}
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {event.speaker}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </div>
                      )}
                    </div>

                    {event.description && (
                      <p className="mt-4 text-gray-700 text-sm line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>

                  {/* Right: QR Code Preview & Actions */}
                  <div className="flex flex-col md:items-end gap-4 md:justify-between md:min-w-48">
                    {/* QR Code Preview */}
                    <div className="bg-gray-100 p-4 rounded-lg flex items-center justify-center h-32 w-32 mx-auto md:mx-0">
                      <img
                        src={event.qrCode}
                        alt="QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                      <button
                        type="button"
                        onClick={() => navigate(`/events/${event.id}/analytics`)}
                        className="btn-primary flex items-center justify-center gap-2 py-2 px-3 text-sm"
                        title="View analytics"
                      >
                        <BarChart3 className="w-4 h-4" />
                        Analytics
                      </button>
                      <button
                        type="button"
                        onClick={() => handleViewQR(event)}
                        className="btn-outline flex items-center justify-center gap-2 py-2 px-3 text-sm"
                        title="View full QR code"
                      >
                        <QrCode className="w-4 h-4" />
                        View QR
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadQR(event)}
                        className="btn-outline flex items-center justify-center gap-2 py-2 px-3 text-sm"
                        title="Download QR code"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/events/${event.id}/edit`)}
                        className="btn-outline flex items-center justify-center gap-2 py-2 px-3 text-sm"
                        title="Edit event"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(event.id, event.name)}
                        className="flex items-center justify-center gap-2 py-2 px-3 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete event"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default EventsPage;
