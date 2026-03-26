import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for generating QR codes
 * Each event gets a unique QR code that encodes the event ID
 */

export interface QRCodeGeneratorOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

class QRCodeGeneratorService {
  /**
   * Generate a QR code for an event
   * The QR code contains the event ID which is used to identify the event when scanned
   */
  async generateEventQRCode(
    eventId: string,
    baseUrl: string = window.location.origin,
    options: QRCodeGeneratorOptions = {}
  ): Promise<string> {
    try {
      const {
        width = 300,
        margin = 2,
        color = { dark: '#000000', light: '#FFFFFF' },
        errorCorrectionLevel = 'M',
      } = options;

      // Use production URL if on localhost (phones can't access localhost)
      const finalBaseUrl = baseUrl.includes('localhost') 
        ? 'https://fellowgix.web.app' 
        : baseUrl;

      // Create the QR code data: URL that points to event check-in page
      const qrData = `${finalBaseUrl}/scan/${eventId}`;

      // Generate QR code as data URL (PNG image)
      const qrDataUrl = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel,
        type: 'image/png',
        width,
        margin,
        color,
      });

      return qrDataUrl;
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  /**
   * Generate a unique event ID
   */
  generateEventId(): string {
    return uuidv4();
  }

  /**
   * Download QR code as PNG image
   */
  async downloadQRCode(qrDataUrl: string, eventName: string): Promise<void> {
    try {
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = `${eventName.replace(/\s+/g, '_')}_QR_Code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      throw new Error(`Failed to download QR code: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  /**
   * Generate QR code as canvas element for preview
   */
  async generateQRCodeCanvas(
    eventId: string,
    baseUrl: string = window.location.origin
  ): Promise<HTMLCanvasElement> {
    try {
      const qrData = `${baseUrl}/scan/${eventId}`;
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, qrData, {
        errorCorrectionLevel: 'M',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return canvas;
    } catch (error) {
      throw new Error(`Failed to generate QR code canvas: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }
}

export const qrCodeGeneratorService = new QRCodeGeneratorService();
