import html2canvas from 'html2canvas';

export interface ECardData {
  eventName: string;
  eventDate: string;
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
      height: 500px;
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
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      ">
        <!-- Left Section: Event Info -->
        <div style="
          flex: 1;
          padding: 40px 30px;
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        ">
          <div>
            <div style="font-size: 12px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
              Check-In Confirmed
            </div>
            <h1 style="
              font-size: 28px;
              font-weight: 700;
              margin: 0 0 10px 0;
              line-height: 1.2;
            ">
              ${this.escapeHtml(data.eventName)}
            </h1>
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 20px;">
              ${this.escapeHtml(data.eventDate)}
            </div>
          </div>

          <div>
            <div style="margiin-bottom: 15px; font-size: 12px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px;">
              Event Attendee
            </div>
            <p style="
              font-size: 20px;
              font-weight: 600;
              margin: 0;
              word-break: break-word;
            ">
              ${this.escapeHtml(data.attendeeName)}
            </p>
            <p style="
              font-size: 12px;
              opacity: 0.85;
              margin: 8px 0 0 0;
            ">
              ${this.escapeHtml(data.attendeeEmail)}
            </p>
          </div>
        </div>

        <!-- Right Section: Attendee Info -->
        <div style="
          flex: 0 0 350px;
          background: rgba(255,255,255,0.95);
          padding: 40px 30px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
        ">
          <!-- Attendee Details -->
          <div style="
            width: 100%;
            text-align: center;
            color: #1f2937;
          ">
            <div style="
              font-size: 11px;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 8px;
              font-weight: 600;
            ">
              Type
            </div>
            <p style="
              font-size: 14px;
              font-weight: 600;
              margin: 0 0 16px 0;
              text-transform: capitalize;
            ">
              ${data.type === 'member' ? '👤 Member' : '🌟 Guest'}
            </p>

            ${data.club ? `
              <div style="
                font-size: 11px;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 4px;
                font-weight: 600;
              ">
                Club
              </div>
              <p style="
                font-size: 13px;
                margin: 0 0 16px 0;
                word-break: break-word;
              ">
                ${this.escapeHtml(data.club)}
              </p>
            ` : ''}

            <div style="
              border-top: 1px solid #e5e7eb;
              padding-top: 16px;
              font-size: 11px;
              color: #9ca3af;
            ">
              Checked in on ${this.escapeHtml(data.checkInTime)}
            </div>
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
