import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { marked } from 'marked';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { environment } from '@/environments/environment';

/**
 * MVP export service: turn the current editor markdown into a downloadable
 * .docx (server-rendered with the hardcoded "GEM Default" template) or a
 * .pdf (client-rendered with html2pdf.js).
 *
 * PDF quality caveat: html2pdf.js rasterises the DOM via html2canvas, so
 * text isn't selectable and complex layouts can degrade. For client-facing
 * deliverables prefer the .docx and export to PDF from Word. Puppeteer
 * server-side is the upgrade path when fidelity becomes a blocker.
 *
 * The "GEM Default" template itself lives in the backend controller
 * (`docs-export.controller.ts`) — we just send the markdown→HTML body and
 * the backend wraps it with cover/header/footer.
 */
@Injectable({ providedIn: 'root' })
export class DocExportService {
  private http = inject(HttpClient);

  /**
   * Convert markdown → HTML, POST to `/docs/export/docx`, download the
   * resulting blob. The backend applies the GEM Default template.
   */
  async exportDocx(markdown: string, title: string): Promise<void> {
    const html = await this.markdownToHtml(markdown);
    const blob = await firstValueFrom(
      this.http.post(
        `${environment.API_URL}/docs/export/docx`,
        { title, html },
        { responseType: 'blob' },
      ),
    );
    saveAs(blob, `${sanitizeFilename(title)}.docx`);
  }

  /**
   * Convert markdown → HTML, render to a DOM node, capture with html2canvas
   * into a single tall canvas, then build the PDF by tiling that canvas
   * across jsPDF pages. This gives us full control over the pipeline
   * (versus html2pdf.js which wraps both with limited debugging).
   *
   * Quality caveat: this is a rasterised PDF — text is not selectable
   * once rendered, and complex layouts degrade. For client-facing
   * deliverables, prefer the .docx and export to PDF from Word.
   */
  async exportPdf(markdown: string, title: string): Promise<void> {
    const html = await this.markdownToHtml(markdown);
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '794px'; // ~A4 width at 96dpi
    container.style.padding = '40px';
    container.style.background = '#fff';
    container.style.color = '#222';
    container.style.fontFamily =
      "'Helvetica Neue', Helvetica, Arial, sans-serif";
    container.style.fontSize = '12pt';
    container.style.lineHeight = '1.5';
    container.style.zIndex = '-9999';
    container.style.pointerEvents = 'none';
    container.innerHTML = `
      <div style="text-align: center; margin-bottom: 32pt;">
        <h1 style="font-size: 36pt; margin: 0 0 12pt; font-weight: bold;">GEM</h1>
        <p style="font-size: 10pt; color: #666; margin: 0;">
          Documento generado el ${new Date().toLocaleDateString('es-AR')}
        </p>
        <h2 style="font-size: 20pt; margin: 24pt 0 0; font-weight: bold;">
          ${escapeHtml(title)}
        </h2>
      </div>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 24pt 0;" />
      ${html}
    `;
    document.body.appendChild(container);

    // eslint-disable-next-line no-console
    console.log('[doc-export] PDF container innerHTML length:', container.innerHTML.length);

    // Pre-load any <img> tags so html2canvas captures them at full fidelity
    // (otherwise they appear blank and taint the canvas).
    const imgs = Array.from(container.querySelectorAll('img'));
    await Promise.all(
      imgs.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve();
              return;
            }
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
            setTimeout(resolve, 3000);
          }),
      ),
    );

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        // Window dimensions force html2canvas to render at the container's
        // actual size, not just the viewport — important for long docs
        // that would otherwise be clipped.
        windowWidth: container.scrollWidth,
        windowHeight: container.scrollHeight,
      });

      // eslint-disable-next-line no-console
      console.log(
        '[doc-export] Canvas captured:',
        canvas.width,
        'x',
        canvas.height,
        'px',
      );

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('html2canvas returned an empty canvas (0x0)');
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pdfWidth = pdf.internal.pageSize.getWidth();   // 210
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297
      const margin = 15;
      const usableWidth = pdfWidth - margin * 2;
      const usableHeight = pdfHeight - margin * 2;
      const imgWidth = usableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Tile the canvas across multiple pages when the doc is taller than one page.
      let heightLeft = imgHeight;
      let position = margin;
      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
      heightLeft -= usableHeight;
      while (heightLeft > 0) {
        position = margin - (imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
        heightLeft -= usableHeight;
      }

      pdf.save(`${sanitizeFilename(title)}.pdf`);
    } finally {
      document.body.removeChild(container);
    }
  }

  /**
   * marked v17 exposes a synchronous `parse()` for non-async usage.
   * We wrap in a promise so callers can `await` uniformly even if we
   * later switch to marked's async tokeniser.
   */
  private async markdownToHtml(markdown: string): Promise<string> {
    const result = marked.parse(markdown, { async: false });
    return typeof result === 'string' ? result : String(result);
  }
}

function sanitizeFilename(s: string): string {
  const trimmed = s.trim().replace(/[\\/:*?"<>|\x00-\x1f]/g, '_');
  return trimmed.length > 0 ? trimmed : 'documento';
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}
