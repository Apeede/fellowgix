import { eventService } from '@services/firebase/event-service';
import { Event } from '@types/event';
import { AlertCircle, ArrowLeft, Loader, User, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

const EventCheckInPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    if (!eventId) {
      toast.error('Event not found');
      navigate('/');
      return;
    }

    try {
      const eventData = await eventService.getEventById(eventId);
      if (eventData && eventData.isActive) {
        setEvent(eventData);
      } else {
        toast.error('Event not found or is inactive');
        navigate('/');
      }
    } catch (error: any) {
      toast.error('Failed to load event');
      console.error(error);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/scan')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Event Check-In</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="card flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading event details...</p>
            </div>
          </div>
        ) : event ? (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="card bg-gradient-to-r from-primary-500 to-primary-700 text-white">
              <h2 className="text-4xl font-bold mb-2">Welcome!</h2>
              <p className="text-xl">
                Now attending: <span className="font-semibold">{event.name}</span>
              </p>
              <div className="mt-4 text-sm opacity-90">
                <p>
                  {new Date(event.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                {event.theme && <p>Theme: {event.theme}</p>}
              </div>
            </div>

            {/* Selection Section */}
            <div>
              <p className="text-center text-gray-600 mb-6 text-lg font-medium">
                Are you a member or a guest?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Member Button */}
                <button
                  onClick={() => navigate(`/events/${eventId}/checkin/member`)}
                  className="card hover:shadow-2xl hover:border-primary-600 transition-all transform hover:-translate-y-1 cursor-pointer border-2 border-transparent group"
                >
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
                      <User className="w-10 h-10 text-primary-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Rotaract Member</h3>
                    <p className="text-gray-600 text-center">
                      I'm a verified member of Rotaract
                    </p>
                  </div>
                </button>

                {/* Guest Button */}
                <button
                  onClick={() => navigate(`/events/${eventId}/checkin/guest`)}
                  className="card hover:shadow-2xl hover:border-primary-600 transition-all transform hover:-translate-y-1 cursor-pointer border-2 border-transparent group"
                >
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-secondary-200 transition-colors">
                      <Users className="w-10 h-10 text-secondary-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Guest</h3>
                    <p className="text-gray-600 text-center">
                      I'm joining as a guest
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Event Details */}
            <div className="card bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Event Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Speaker</p>
                  <p className="font-semibold text-gray-900">{event.speaker}</p>
                </div>
                {event.location && (
                  <div>
                    <p className="text-gray-600">Location</p>
                    <p className="font-semibold text-gray-900">{event.location}</p>
                  </div>
                )}
              </div>
              {event.description && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-gray-600">About</p>
                  <p className="text-gray-900">{event.description}</p>
                </div>
              )}
            </div>

            {/* Back to Scan */}
            <div className="text-center">
              <button
                onClick={() => navigate('/scan')}
                className="text-primary-600 hover:text-primary-700 font-medium underline"
              >
                Scan Different Event
              </button>
            </div>
          </div>
        ) : (
          <div className="card text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Event Not Found</h3>
            <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or is inactive.</p>
            <button
              onClick={() => navigate('/scan')}
              className="btn-primary"
            >
              Scan Another QR Code
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default EventCheckInPage;
