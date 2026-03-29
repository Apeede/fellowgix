import { Html5QrcodeScanner } from 'html5-qrcode';
import { AlertCircle, ArrowLeft, Loader } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null); // null = checking
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const mountedRef = useRef(true);

  const clearScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.clear().catch(() => undefined);
      scannerRef.current = null;
    }
  };

  const initScanner = async () => {
    setError(null);
    setHasCamera(null);
    await clearScanner();

    try {
      const devices = await Html5QrcodeScanner.getCameras();
      if (!mountedRef.current) return;

      if (!devices || devices.length === 0) {
        setHasCamera(false);
        setError('No camera found on this device');
        return;
      }

      setHasCamera(true);

      window.setTimeout(() => {
        if (!mountedRef.current) return;
        try {
          scannerRef.current = new Html5QrcodeScanner(
            'qr-scanner',
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1,
              disableFlip: false,
              rememberLastUsedCamera: true,
            },
            false
          );
          scannerRef.current.render(onScanSuccess, () => undefined);
        } catch (err) {
          console.error('Scanner init error:', err);
          if (mountedRef.current) {
            setHasCamera(false);
            setError('Failed to initialize camera');
          }
        }
      }, 100);
    } catch (err) {
      console.error('Camera permission error:', err);
      if (mountedRef.current) {
        setHasCamera(false);
        const needsSecureContext = window.location.protocol !== 'https:' && window.location.hostname !== 'localhost';
        setError(
          needsSecureContext
            ? 'Camera requires a secure HTTPS connection on this device'
            : 'Camera permission denied or not available'
        );
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    initScanner();

    return () => {
      mountedRef.current = false;
      clearScanner();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScanSuccess = (decodedText: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const rawText = decodedText.trim();
      let eventId: string | null = null;

      // Direct event ID (Firestore auto-ID format)
      if (/^[0-9a-zA-Z]{20}$/.test(rawText)) {
        eventId = rawText;
      } else {
        try {
          const url = new URL(rawText);
          const parts = url.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
          // /events/:id/checkin or /scan/:id
          if (parts[0] === 'events' && parts[1]) eventId = parts[1];
          else if (parts[0] === 'scan' && parts[1]) eventId = parts[1];
          else eventId = parts[parts.length - 1] || null;
        } catch {
          // Not a URL — take last path segment
          const parts = rawText.split('/').filter(Boolean);
          eventId = parts[parts.length - 1] || null;
        }
      }

      if (eventId) {
        scannerRef.current?.pause();
        navigate(`/events/${eventId}/checkin`, { replace: true });
      } else {
        setError('Invalid QR code format');
        toast.error('Invalid QR code format');
        setIsLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process QR code');
      toast.error('Failed to process QR code');
      setIsLoading(false);
    }
  };

  const handleManualEntry = (eventId: string) => {
    if (eventId.trim()) {
      navigate(`/events/${eventId.trim()}/checkin`, { replace: true });
    }
  };

  // Still checking camera
  if (hasCamera === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Checking camera access…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Scan Event QR Code</h1>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="card space-y-6">
          <div className="text-center">
            <p className="text-gray-600 mb-1">Point your camera at the event QR code</p>
            <p className="text-sm text-gray-500">Make sure you're in a well-lit area</p>
          </div>

          {/* Scanner area — always rendered when camera is available so #qr-scanner exists in DOM */}
          {hasCamera ? (
            <div className="relative bg-gray-100 rounded-lg overflow-hidden min-h-[320px]">
              {isLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 rounded-lg">
                  <div className="text-center">
                    <Loader className="w-12 h-12 text-white animate-spin mx-auto mb-3" />
                    <p className="text-white font-medium">Processing QR Code…</p>
                  </div>
                </div>
              )}
              {/* This div MUST always be in the DOM when hasCamera is true */}
              <div id="qr-scanner" className="w-full" />
            </div>
          ) : (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-900 mb-2">Camera Not Available</h3>
              <p className="text-red-700 mb-2">{error || 'Unable to access your device camera'}</p>
              <p className="text-sm text-red-600 mb-4">Check camera permissions and try again</p>
              <button
                type="button"
                onClick={() => initScanner()}
                className="btn-primary"
              >
                Retry Camera Access
              </button>
            </div>
          )}

          {/* Scan error (non-camera) */}
          {error && hasCamera && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">{error}</p>
            </div>
          )}

          {/* Manual Entry */}
          <div className="border-t border-gray-200 pt-4">
            <p className="text-center text-sm text-gray-600 mb-3">
              Can't scan? Enter the event ID manually
            </p>
            <div className="flex gap-2">
              <label htmlFor="manual-event-id" className="sr-only">Event ID</label>
              <input
                id="manual-event-id"
                type="text"
                placeholder="Event ID"
                className="input-field flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleManualEntry((e.target as HTMLInputElement).value);
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  handleManualEntry(input.value);
                }}
                className="btn-primary"
              >
                Go
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ScannerPage;
