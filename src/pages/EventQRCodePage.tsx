import { eventService } from '@services/firebase/event-service';
import { qrCodeGeneratorService } from '@services/qrcode/qrcode-generator';
import { Event } from '@types/event';
import { ArrowLeft, Download, Eye, EyeOff, Loader } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const EventQRCodePage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const printRef = useRef<HTMLDivElement>(null);

  const [event, setEvent] = useState<Event | null>(
    (location.state as any)?.event || null
  );
  const [isLoading, setIsLoading] = useState(!event);
  const [showDetails, setShowDetails] = useState(true);

  // Load event if not passed via state
  useEffect(() => {
    if (!event && eventId) {
      loadEvent();
    }
  }, [eventId, event]);

  const loadEvent = async () => {
    if (!eventId) return;

    setIsLoading(true);
    try {
      const data = await eventService.getEventById(eventId);
      if (data) {
        setEvent(data);
      } else {
        toast.error('Event not found');
        navigate('/events');
      }
    } catch (error: any) {
      toast.error('Failed to load event');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!event) return;

    try {
      await qrCodeGeneratorService.downloadQRCode(event.qrCode, event.name);
      toast.success('QR Code downloaded!');
    } catch (error: any) {
      toast.error('Failed to download QR code');
      console.error(error);
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Print QR Code</title>');
        printWindow.document.write(
          '<style>body { font-family: Arial, sans-serif; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }'
        );
        printWindow.document.write('</style></head><body>');
        printWindow.document.write(printRef.current.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/events')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Event QR Code</h1>
            </div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="btn-secondary flex items-center gap-2 py-2"
            >
              {showDetails ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Hide Details
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Show Details
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="card flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading event...</p>
            </div>
          </div>
        ) : event ? (
          <div className="space-y-6">
            {/* QR Code Display Card */}
            <div ref={printRef} className="card">
              <div className="flex flex-col items-center justify-center py-8">
                {/* Event Header */}
                {showDetails && (
                  <div className="text-center mb-8 w-full">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      {event.name}
                    </h2>
                    <p className="text-gray-600">{event.theme}</p>
                    <div className="mt-4 text-sm text-gray-500">
                      <p>
                        {new Date(event.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      {event.time && <p>{event.time}</p>}
                    </div>
                  </div>
                )}

                {/* QR Code */}
                <div className="bg-white p-12 rounded-lg shadow-md border-2 border-gray-200">
                  <img
                    src={event.qrCode}
                    alt="Event QR Code"
                    className="w-96 h-96 object-contain"
                  />
                </div>

                {/* Instructions */}
                {showDetails && (
                  <div className="mt-8 text-center max-w-md">
                    <p className="text-gray-600 text-sm">
                      Scan this QR code to check in for the event
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Details Section */}
            {showDetails && (
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Event Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Event Name</p>
                    <p className="text-gray-900 mt-1">{event.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Theme</p>
                    <p className="text-gray-900 mt-1">{event.theme}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Date</p>
                    <p className="text-gray-900 mt-1">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Time</p>
                    <p className="text-gray-900 mt-1">
                      {event.time || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Speaker</p>
                    <p className="text-gray-900 mt-1">{event.speaker}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Location</p>
                    <p className="text-gray-900 mt-1">
                      {event.location || 'Not specified'}
                    </p>
                  </div>
                  {event.description && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-600">Description</p>
                      <p className="text-gray-900 mt-1">{event.description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handlePrint}
                className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2h-2.5a2 2 0 00-1 .268V9m-12 5v5h8v-5m0 0H9m3 0h3"
                  />
                </svg>
                Print QR Code
              </button>
              <button
                onClick={handleDownload}
                className="btn-secondary flex-1 py-3 flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download QR Code
              </button>
            </div>
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-600">Event not found</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default EventQRCodePage;
