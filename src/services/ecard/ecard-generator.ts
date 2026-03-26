import html2canvas from 'html2canvas';

export interface ECardData {
  eventName: string;
  eventDate: string;
  eventTheme?: string;
  eventSpeaker?: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
  type: 'member' | 'guest';
  club?: string;
  checkInTime: string;
  eventColor: string;
}

export class ECardGeneratorService {
  /**
   * Generate an e-card as a PNG image (base64 or blob)
   */
  static async generateECard(data: ECardData): Promise<{
    canvas: HTMLCanvasElement;
    dataUrl: string;
  }> {
    // Create e-card container element
    const container = this.createECardElement(data);
    document.body.appendChild(container);

    try {
      // Convert HTML to canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      // Get data URL
      const dataUrl = canvas.toDataURL('image/png');

      return { canvas, dataUrl };
    } finally {
      // Clean up
      document.body.removeChild(container);
    }
  }

  /**
   * Download e-card as PNG file
   */
  static async downloadECard(data: ECardData, filename: string = 'ecard.png'): Promise<void> {
    const { dataUrl } = await this.generateECard(data);

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Create e-card HTML element
   */
  private static createECardElement(data: ECardData): HTMLDivElement {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      top: -9999px;
      width: 800px;
      height: 600px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;

    // Main card background with gradient
    const colorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
    const bgColor = colorRegex.test(data.eventColor) ? data.eventColor : '#6366f1';
    container.innerHTML = `
      <div style="
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, ${bgColor} 0%, ${this.darkenColor(bgColor, 20)} 100%);
        border-radius: 20px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        position: relative;
      ">
        <!-- Header -->
        <div style="
          background: rgba(255,255,255,0.1);
          padding: 30px 40px 20px;
          text-align: center;
          border-bottom: 1px solid rgba(255,255,255,0.2);
        ">
          <h1 style="
            font-size: 32px;
            font-weight: 700;
            color: white;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">
            Thank You for Attending
          </h1>
        </div>

        <!-- Main Content -->
        <div style="
          flex: 1;
          padding: 30px 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        ">
          <!-- Thank You Message -->
          <div style="color: white; margin-bottom: 30px;">
            <p style="
              font-size: 16px;
              line-height: 1.6;
              margin: 0;
              text-align: center;
            ">
              Thank you for joining us at this fellowship. Your presence contributed to a meaningful and engaging experience, and we truly appreciate the time you took to be part of it.
            </p>
          </div>

          <!-- Event Details -->
          <div style="
            background: rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            color: white;
          ">
            <h3 style="
              font-size: 18px;
              font-weight: 600;
              margin: 0 0 15px 0;
              text-align: center;
            ">
              Event Details
            </h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
              <div><strong>Event:</strong> ${this.escapeHtml(data.eventName)}</div>
              <div><strong>Date:</strong> ${this.escapeHtml(data.eventDate)}</div>
              ${data.eventTheme ? `<div><strong>Theme:</strong> ${this.escapeHtml(data.eventTheme)}</div>` : ''}
              ${data.eventSpeaker ? `<div><strong>Speaker:</strong> ${this.escapeHtml(data.eventSpeaker)}</div>` : ''}
            </div>
          </div>

          <!-- Attendee Info -->
          <div style="
            background: rgba(255,255,255,0.95);
            border-radius: 12px;
            padding: 20px;
            color: #1f2937;
            text-align: center;
          ">
            <h3 style="
              font-size: 18px;
              font-weight: 600;
              margin: 0 0 15px 0;
              color: ${bgColor};
            ">
              Attendee
            </h3>
            <p style="
              font-size: 20px;
              font-weight: 600;
              margin: 0 0 8px 0;
            ">
              ${this.escapeHtml(data.attendeeName)}
            </p>
            <p style="
              font-size: 14px;
              color: #6b7280;
              margin: 0;
            ">
              ${data.club ? this.escapeHtml(data.club) : 'Guest'}
            </p>
          </div>

          <!-- Footer Message -->
          <div style="
            text-align: center;
            color: white;
            margin-top: 20px;
          ">
            <p style="
              font-size: 14px;
              font-style: italic;
              margin: 0;
            ">
              We look forward to welcoming you again.
            </p>
          </div>
        </div>

        <!-- Bottom Decoration -->
        <div style="
          height: 60px;
          background: rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          border-top: 1px solid rgba(255,255,255,0.2);
        ">
          <div style="
            font-size: 12px;
            color: rgba(255,255,255,0.7);
            text-align: center;
          ">
            Checked in on ${this.escapeHtml(data.checkInTime)}
          </div>
        </div>
      </div>
    `;

    return container;
  }

  /**
   * Generate QR code and embed it in the e-card
   * Note: Currently not used - QR code generation happens separately
   */
  static async embedQRCode(): Promise<void> {
    // QR code embedding deferred for future enhancement
    // Can implement using dynamic canvas rendering if needed
  }

  /**
   * Darken a hex color by a percentage
   */
  private static darkenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, num >> 16) - amt;
    const G = Math.max(0, (num >> 8) & 0x00ff) - amt;
    const B = Math.max(0, num & 0x0000ff) - amt;
    return `#${(0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)}`;
  }

  /**
   * Escape HTML special characters
   */
  private static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
