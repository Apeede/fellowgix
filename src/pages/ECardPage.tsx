import { ECardData, ECardGeneratorService } from '@services/ecard/ecard-generator';
import { eventService } from '@services/firebase/event-service';
import { ArrowLeft, Download, Loader, Share2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';

interface LocationState {
  eventId: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
  type: 'member' | 'guest';
  club?: string;
}

interface EventDetails {
  id: string;
  name: string;
  date: string;
  theme?: string;
}

const ECardPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const state = location.state as LocationState;
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [eCardImage, setECardImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  // Validate state
  useEffect(() => {
    if (!state?.eventId || !state?.attendeeName) {
      toast.error('Invalid e-card data');
      navigate('/scan', { replace: true });
      return;
    }

    loadEventAndGenerateECard();
  }, [state?.eventId, state?.attendeeName, navigate, loadEventAndGenerateECard]);

  const loadEventAndGenerateECard = useCallback(async () => {
    try {
      setIsGenerating(true);

      // Load event details
      const event = await eventService.getEventById(state.eventId);
      if (!event) {
        toast.error('Event not found');
        navigate('/scan', { replace: true });
        return;
      }

      setEventDetails(event);

      // Generate e-card
      const eCardData: ECardData = {
        eventName: event.name,
        eventDate: new Date(event.date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        eventTheme: event.theme,
        eventSpeaker: event.speaker,
        attendeeName: state.attendeeName,
        attendeeEmail: state.attendeeEmail,
        attendeePhone: state.attendeePhone,
        type: state.type,
        club: state.club,
        checkInTime: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        eventColor: event.theme || '#6366f1',
      };

      const { dataUrl } = await ECardGeneratorService.generateECard(eCardData);
      setECardImage(dataUrl);
    } catch (error) {
      toast.error('Failed to generate e-card');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  }, [state?.eventId, state?.attendeeName, state?.attendeeEmail, state?.attendeePhone, state?.club, state?.type, navigate]);

  const handleDownload = async () => {
    if (!eCardImage) return;

    setIsDownloading(true);
    try {
      const link = document.createElement('a');
      link.href = eCardImage;
      link.download = `ecard-${state.attendeeName.replace(/\s+/g, '-')}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('E-card downloaded!');
    } catch (error) {
      toast.error('Failed to download e-card');
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!eCardImage) return;

    try {
      // Convert data URL to blob
      const response = await fetch(eCardImage);
      const blob = await response.blob();
      const file = new File([blob], `ecard-${Date.now()}.png`, { type: 'image/png' });

      // Check if Web Share API is available
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${state.attendeeName}'s Event E-Card`,
          text: `Check out my e-card for ${eventDetails?.name}!`,
          files: [file],
        });
        toast.success('E-card shared!');
      } else {
        // Fallback: copy to clipboard message
        toast.success('Share not available on this device');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Share error:', error);
      }
    }
  };

  const handleBackToScanner = () => {
    navigate('/scan', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Your Event E-Card</h1>
            <div className="w-10" /> {/* Spacer for alignment */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {isGenerating ? (
          // Loading State
          <div className="flex flex-col items-center justify-center py-24">
            <Loader className="w-12 h-12 text-primary-600 animate-spin mb-4" />
            <p className="text-gray-600 font-medium">Generating your e-card...</p>
          </div>
        ) : eCardImage ? (
          // Display E-Card
          <div className="space-y-8">
            {/* E-Card Display */}
            <div className="card p-0 overflow-hidden">
              <div className="bg-gray-100 p-6 flex justify-center">
                <img
                  src={eCardImage}
                  alt="Event E-Card"
                  className="max-w-2xl w-full rounded-lg shadow-xl"
                />
              </div>
            </div>

            {/* Attendee Info Summary */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="card bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="text-sm font-medium text-gray-600 mb-2">Attendee</div>
                <p className="text-lg font-bold text-gray-900">{state.attendeeName}</p>
              </div>
              <div className="card bg-gradient-to-br from-green-50 to-emerald-50">
                <div className="text-sm font-medium text-gray-600 mb-2">Type</div>
                <p className="text-lg font-bold text-gray-900 capitalize">
                  {state.type === 'member' ? '👤 Member' : '🌟 Guest'}
                </p>
              </div>
              <div className="card bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="text-sm font-medium text-gray-600 mb-2">Event</div>
                <p className="text-lg font-bold text-gray-900 truncate">
                  {eventDetails?.name}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="btn-primary flex items-center justify-center gap-2 flex-1"
              >
                {isDownloading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isDownloading ? 'Downloading...' : 'Download E-Card'}
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="btn-secondary flex items-center justify-center gap-2 flex-1"
              >
                <Share2 className="w-4 h-4" />
                Share E-Card
              </button>

              <button
                type="button"
                onClick={handleBackToScanner}
                className="btn-secondary flex items-center justify-center gap-2 flex-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Scan Another Event
              </button>
            </div>

            {/* Info Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-900">
                💾 Download your e-card to keep a record of your attendance, or share it with
                others!
              </p>
            </div>
          </div>
        ) : (
          // Error State
          <div className="card text-center py-12">
            <p className="text-gray-600 mb-6">Failed to generate e-card</p>
            <button type="button" onClick={handleBackToScanner} className="btn-primary">
              Back to Scanner
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ECardPage;
