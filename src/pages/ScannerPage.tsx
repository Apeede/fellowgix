import { Html5QrcodeScanner } from 'html5-qrcode';
import { AlertCircle, ArrowLeft, Loader } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    checkCameraPermission();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [checkCameraPermission]);

  const checkCameraPermission = useCallback(async () => {
    try {
      const devices = await Html5QrcodeScanner.getCameras();
      if (devices && devices.length > 0) {
        try {
          scannerRef.current = new Html5QrcodeScanner(
            'qr-scanner',
            { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1, disableFlip: false },
            false
          );
          scannerRef.current.render(onScanSuccess, onScanError);
        } catch (err) {
          setError('Failed to initialize camera');
        }
      } else {
        setHasCamera(false);
        setError('No camera found on this device');
      }
    } catch (err) {
      setHasCamera(false);
      setError('Camera permission denied or not available');
    }
  }, [onScanSuccess]);

  const onScanSuccess = useCallback((decodedText: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Extract event ID from QR code data
      // Expected format: http://localhost:5173/scan/eventId
      const eventId = decodedText.split('/').pop();

      if (eventId) {
        // Stop scanner before navigation
        if (scannerRef.current) {
          scannerRef.current.pause();
        }

        // Navigate to event check-in page
        navigate(`/events/${eventId}/checkin`, { replace: true });
      } else {
        setError('Invalid QR code');
        toast.error('Invalid QR code format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      toast.error('Failed to process QR code');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const onScanError = () => {
    // Suppress error messages during scanning
    // Only show actual errors, not "No QR found" messages
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/events')}
              aria-label="Go back"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Scan Event QR Code</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="card">
          <div className="space-y-6">
            {/* Instructions */}
            <div className="text-center">
              <p className="text-gray-600 mb-2">
                Point your camera at the event QR code to get started
              </p>
              <p className="text-sm text-gray-500">
                Make sure you're in a well-lit area
              </p>
            </div>

            {/* Scanner Container */}
            {hasCamera ? (
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                {isLoading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded-lg">
                    <div className="text-center">
                      <Loader className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
                      <p className="text-white">Processing QR Code...</p>
                    </div>
                  </div>
                )}
                <div id="qr-scanner" className="w-full"></div>
              </div>
            ) : (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-900 mb-2">Camera Not Available</h3>
                <p className="text-red-700 mb-4">{error || 'Unable to access your device camera'}</p>
                <p className="text-sm text-red-600">
                  Please check camera permissions and try again
                </p>
              </div>
            )}

            {/* Error Display */}
            {error && hasCamera && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">{error}</p>
              </div>
            )}

            {/* Manual Entry Option */}
            <div className="border-t border-gray-200 pt-6">
              <p className="text-center text-sm text-gray-600 mb-4">
                Can't scan? You can enter the event code manually
              </p>
              <div className="flex gap-2">
                <label htmlFor="manual-event-id" className="sr-only">Event ID</label>
                <input
                  id="manual-event-id"
                  type="text"
                  placeholder="Event ID"
                  className="input-field flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const eventId = (e.target as HTMLInputElement).value.trim();
                      if (eventId) {
                        navigate(`/events/${eventId}/checkin`, { replace: true });
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  title="Go to event check-in"
                  onClick={(e) => {
                    const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                    const eventId = input.value.trim();
                    if (eventId) {
                      navigate(`/events/${eventId}/checkin`, { replace: true });
                    }
                  }}
                  className="btn-primary"
                >
                  Enter
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ScannerPage;
