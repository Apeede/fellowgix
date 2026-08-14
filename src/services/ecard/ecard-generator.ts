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
  organizationLogo?: string;
  clubLogo?: string;
  customMessage?: string;
  clubType?: 'rotary' | 'rotaract';
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

    const safeImage = (value?: string) => value && /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value) ? value : '';
    const logo = safeImage(data.clubLogo) || safeImage(data.organizationLogo);
    const message = data.customMessage?.trim() || 'Thank you for sharing your time and energy with us. Your presence helped make this gathering meaningful, and we look forward to welcoming you again.';
    const isRotary = data.clubType === 'rotary';
    const primaryColor = isRotary ? '#17458f' : '#d41367';
    const secondaryColor = isRotary ? '#f7a81b' : '#f05a28';
    const paleColor = isRotary ? '#eef4fb' : '#fff0f5';
    const clubFamily = isRotary ? 'ROTARY' : 'ROTARACT';
    container.innerHTML = `
      <div style="
        width: 100%;
        height: 100%;
        background: #ffffff;
        border-radius: 22px;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        position: relative;
        color:#172033;
      ">
        <div style="position:absolute;left:0;top:0;bottom:0;width:15px;background:linear-gradient(180deg,${primaryColor} 0%,${primaryColor} 72%,${secondaryColor} 72%,${secondaryColor} 100%);"></div>
        <div style="position:absolute;right:-115px;top:-130px;width:330px;height:330px;border-radius:50%;background:${paleColor};"></div>
        <div style="position:absolute;right:-32px;top:-62px;width:190px;height:190px;border-radius:50%;border:2px solid ${secondaryColor};opacity:.32;"></div>

        <div style="height:100%;box-sizing:border-box;padding:42px 52px 34px 62px;display:flex;flex-direction:column;position:relative;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;min-height:78px;">
            <div style="height:74px;display:flex;align-items:flex-start;">
              ${logo ? `<img src="${logo}" alt="Club logo" style="display:block;max-width:190px;max-height:74px;width:auto;height:auto;object-fit:contain;object-position:left top;" />` : `<div style="font-size:20px;font-weight:800;letter-spacing:2px;color:${primaryColor};">${clubFamily}</div>`}
            </div>
            <div style="padding:9px 14px;border:1px solid ${primaryColor};color:${primaryColor};font-size:10px;font-weight:800;letter-spacing:2.2px;border-radius:999px;">${clubFamily} FELLOWSHIP</div>
          </div>

          <div style="margin-top:14px;">
            <div style="font-size:13px;font-weight:800;letter-spacing:3.4px;color:${secondaryColor};margin-bottom:8px;">THANK YOU FOR ATTENDING</div>
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:38px;line-height:1.1;font-weight:700;color:${primaryColor};margin-bottom:6px;">${this.escapeHtml(data.attendeeName)}</div>
            <div style="width:76px;height:4px;background:${secondaryColor};"></div>
          </div>

          <p style="font-size:14px;line-height:1.55;color:#475467;white-space:pre-line;margin:17px 0 19px;max-width:650px;">
            ${this.escapeHtml(message)}
          </p>

          <div style="background:${paleColor};border-left:4px solid ${primaryColor};padding:15px 18px;display:grid;grid-template-columns:1.55fr 1fr;gap:22px;">
            <div>
              <div style="font-size:9px;font-weight:800;letter-spacing:1.8px;color:${primaryColor};margin-bottom:5px;">EVENT</div>
              <div style="font-size:17px;line-height:1.25;font-weight:750;color:#172033;">${this.escapeHtml(data.eventName)}</div>
              ${data.eventTheme ? `<div style="font-size:11px;line-height:1.35;color:#667085;margin-top:4px;">${this.escapeHtml(data.eventTheme)}</div>` : ''}
            </div>
            <div>
              <div style="font-size:9px;font-weight:800;letter-spacing:1.8px;color:${primaryColor};margin-bottom:5px;">DATE</div>
              <div style="font-size:12px;line-height:1.45;font-weight:650;color:#344054;">${this.escapeHtml(data.eventDate)}</div>
              ${data.eventSpeaker ? `<div style="font-size:10px;line-height:1.4;color:#667085;margin-top:4px;">Speaker: ${this.escapeHtml(data.eventSpeaker)}</div>` : ''}
            </div>
          </div>

          <div style="margin-top:auto;display:flex;align-items:flex-end;justify-content:space-between;padding-top:17px;">
            <div>
              <div style="font-size:10px;font-weight:750;color:#344054;">${data.club ? this.escapeHtml(data.club) : (data.type === 'member' ? 'Member' : 'Guest')}</div>
              <div style="font-size:9px;color:#98a2b3;margin-top:4px;">Attendance confirmed at ${this.escapeHtml(data.checkInTime)}</div>
            </div>
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;font-style:italic;color:${primaryColor};">Service • Fellowship • Impact</div>
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
   * Escape HTML special characters
   */
  private static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
