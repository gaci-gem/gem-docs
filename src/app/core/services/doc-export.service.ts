import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { marked } from 'marked';
import mermaid from 'mermaid';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { environment } from '@/environments/environment';
import { splitFrontmatter } from '../markdown/frontmatter';

type ExportFormat = 'pdf' | 'docx';
type RenderedMermaidSvg = (id: string, source: string) => Promise<string>;
type RasterizedMermaidSvg = (svg: string) => Promise<{ dataUri: string; width: number; height: number }>;

export interface ExportReferenceCatalogEntry {
  id: string;
  label: string;
  kind: 'user' | 'event' | 'page';
}

export interface ExportReferenceOrigins {
  gemWebUrl: string;
  gemDocsUrl: string;
}

export interface PdfLinkAnnotation {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PdfLinkMappingOptions {
  canvasWidth: number;
  canvasHeight: number;
  margin: number;
  imgWidth: number;
  pageSourceHeight: number;
  sourceY: number;
  sliceHeight: number;
}

let mermaidExportSequence = 0;

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
  async exportDocx(
    markdown: string,
    title: string,
    documentId?: string | null,
    references: readonly ExportReferenceCatalogEntry[] = [],
  ): Promise<void> {
    const html = await this.markdownToHtml(markdown, documentId, 'docx', references);
    const content = document.createElement('div');
    content.innerHTML = html;
    await inlineExportImages(content, documentId, (url) => firstValueFrom(this.http.get(url, { responseType: 'blob' })));
    const blob = await firstValueFrom(
      this.http.post(
        `${environment.API_URL}/docs/export/docx`,
        { title, html: content.innerHTML, documentId },
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
  async exportPdf(
    markdown: string,
    title: string,
    documentId?: string | null,
    references: readonly ExportReferenceCatalogEntry[] = [],
  ): Promise<void> {
    const html = await this.markdownToHtml(markdown, documentId, 'pdf', references);
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
      <style>
        h1, h2, h3, h4, p, blockquote, pre, ul, ol, img { break-inside: avoid; }
        figure, svg { break-inside: avoid; max-width: 100%; }
        table { break-inside: auto; border-collapse: collapse; }
        tr { break-inside: avoid; break-after: auto; }
        thead { display: table-header-group; }
      </style>
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

    await inlineExportImages(container, documentId, (url) => firstValueFrom(this.http.get(url, { responseType: 'blob' })));

    // eslint-disable-next-line no-console
    console.log('[doc-export] PDF container innerHTML length:', container.innerHTML.length);

    // Pre-load any <img> tags so html2canvas captures them at full fidelity
    // (otherwise they appear blank and taint the canvas).
    await waitForExportImages(container);

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

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pdfWidth = pdf.internal.pageSize.getWidth();   // 210
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297
      const margin = 15;
      const usableWidth = pdfWidth - margin * 2;
      const usableHeight = pdfHeight - margin * 2;
      const imgWidth = usableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Do not place the same tall image at a negative offset on every page.
      // That approach overlaps the boundary row and makes html2canvas content
      // appear twice at page breaks. Crop one non-overlapping source slice per
      // PDF page instead.
      const pageSourceHeight = (usableHeight / imgHeight) * canvas.height;
      let sourceY = 0;
      for (const sliceHeight of pdfSliceHeights(canvas.height, pageSourceHeight)) {
        const slice = document.createElement('canvas');
        slice.width = canvas.width;
        slice.height = Math.max(1, Math.ceil(sliceHeight));
        const context = slice.getContext('2d');
        if (!context) throw new Error('Unable to create PDF canvas slice');
        context.drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, slice.width, slice.height);
        const sliceData = slice.toDataURL('image/jpeg', 0.95);
        const renderedHeight = (slice.height * imgWidth) / slice.width;
        if (sourceY > 0) pdf.addPage();
        pdf.addImage(sliceData, 'JPEG', margin, margin, imgWidth, renderedHeight);
        for (const link of pdfLinkAnnotations(container, {
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
          margin,
          imgWidth,
          pageSourceHeight,
          sourceY,
          sliceHeight,
        })) {
          pdf.link(link.x, link.y, link.width, link.height, { url: link.url });
        }
        sourceY += sliceHeight;
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
  private async markdownToHtml(
    markdown: string,
    documentId: string | null | undefined,
    format: ExportFormat,
    references: readonly ExportReferenceCatalogEntry[],
  ): Promise<string> {
    const exportMarkdown = splitFrontmatter(markdown).body;
    const safeReferenceMarkdown = escapeReferenceLabelsBeforeMarkdown(exportMarkdown);
    const result = marked.parse(safeReferenceMarkdown, { async: false });
    const html = typeof result === 'string' ? result : String(result);
    // Replace hardcoded dev URLs with the real API URL so exported images resolve
    const normalized = html.replace(/http:\/\/localhost:4000/g, environment.API_URL);
    const root = document.createElement('div');
    root.innerHTML = normalized;
    normalizeExportImageSources(root, documentId);
    renderExportReferences(root, references);
    await renderExportMermaidBlocks(root, format);
    return root.innerHTML;
  }
}

/** Keep HTML-like document labels as text without changing code spans or fences. */
function escapeReferenceLabelsBeforeMarkdown(markdown: string): string {
  let markerPrefix = '\uE000GEMDOCS_CODE_';
  while (markdown.includes(markerPrefix)) markerPrefix += '_';
  const codeRegions: string[] = [];
  const withoutCode = markdown.replace(/(`+|~{3,})[\s\S]*?\1/g, (code) => {
    const marker = `${markerPrefix}${codeRegions.length}\uE001`;
    codeRegions.push(code);
    return marker;
  });
  const escaped = withoutCode.replace(/\[\[([^|\]\s]+)\|([^\]\r\n]+)\]\]/g, (_reference, id: string, label: string) =>
    `[[${id}|${label.replace(/</g, '&lt;').replace(/>/g, '&gt;')}]]`,
  );
  return escaped.replace(new RegExp(`${markerPrefix}(\\d+)\\uE001`, 'g'), (_marker, index: string) => codeRegions[Number(index)] ?? '');
}

/** Replace persisted reference tokens with safe, catalog-backed export labels and links. */
export function renderExportReferences(
  root: ParentNode,
  references: readonly ExportReferenceCatalogEntry[],
  origins: ExportReferenceOrigins = {
    gemWebUrl: environment.GEM_WEB_URL,
    gemDocsUrl: environment.GEM_DOCS_URL,
  },
): void {
  const labels = new Map(references.map((reference) => [`${reference.kind}:${reference.id}`, reference.label]));
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (!node.parentElement?.closest('a, code, pre, script, style, textarea')) textNodes.push(node);
  }

  const pattern = /(^|\s)(@usuario:([^\s]+)|@evento:([^\s]+)|\[\[([^|\]\s]+)\|([^\]\r\n]+)\]\])/g;
  for (const textNode of textNodes) {
    const text = textNode.data;
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    let match: RegExpExecArray | null;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(text))) {
      const prefix = match[1];
      const userId = match[3];
      const eventId = match[4];
      const pageId = match[5];
      const referenceKind: ExportReferenceCatalogEntry['kind'] = userId ? 'user' : eventId ? 'event' : 'page';
      const id = userId ?? eventId ?? pageId ?? '';
      const referenceStart = match.index + prefix.length;
      fragment.append(document.createTextNode(text.slice(cursor, referenceStart)));

      const label = labels.get(`${referenceKind}:${id}`)?.trim();
      const fallback = referenceKind === 'user'
        ? `User (${id})`
        : referenceKind === 'event'
          ? `Event (${id})`
          : match[6]?.trim() || `Page (${id})`;
      const display = label || fallback;
      const href = label ? exportReferenceHref(referenceKind, id, origins) : null;
      if (href) {
        const anchor = document.createElement('a');
        anchor.href = href;
        anchor.textContent = display;
        fragment.append(anchor);
      } else {
        fragment.append(document.createTextNode(display));
      }

      cursor = pattern.lastIndex;
    }

    if (cursor === 0) continue;
    fragment.append(document.createTextNode(text.slice(cursor)));
    textNode.replaceWith(fragment);
  }
}

function exportReferenceHref(
  kind: ExportReferenceCatalogEntry['kind'],
  id: string,
  origins: ExportReferenceOrigins,
): string | null {
  const base = kind === 'page' ? origins.gemDocsUrl : origins.gemWebUrl;
  try {
    const parsedBase = new URL(base);
    if (!['http:', 'https:'].includes(parsedBase.protocol) || parsedBase.username || parsedBase.password) return null;
    const route = kind === 'user' ? 'usuario/perfil' : kind === 'event' ? 'evento/evento' : 'docs';
    return new URL(`/${route}/${encodeURIComponent(id)}`, parsedBase.origin).toString();
  } catch {
    return null;
  }
}

/** Transform Mermaid code blocks only in export markup; stored Markdown stays unchanged. */
export async function renderExportMermaidBlocks(
  root: ParentNode,
  format: ExportFormat,
  renderSvg: RenderedMermaidSvg = renderMermaidSvg,
  rasterizeSvg: RasterizedMermaidSvg = svgToPngDataUri,
): Promise<void> {
  const blocks = Array.from(root.querySelectorAll('pre > code.language-mermaid'));
  for (const code of blocks) {
    const source = code.textContent ?? '';
    const pre = code.parentElement;
    if (!pre) continue;

    try {
      const id = `gem-export-mermaid-${++mermaidExportSequence}`;
      const svg = addMermaidAccessibility(await renderSvg(id, source), id, source);
      if (format === 'pdf') {
        const svgDocument = new DOMParser().parseFromString(svg, 'image/svg+xml');
        const diagram = svgDocument.documentElement;
        if (diagram.localName !== 'svg' || svgDocument.querySelector('parsererror')) throw new Error('Invalid Mermaid SVG');
        pre.replaceWith(document.importNode(diagram, true));
      } else {
        const image = await rasterizeSvg(svg);
        if (!isValidMermaidPng(image)) throw new Error('Invalid Mermaid PNG');
        const img = document.createElement('img');
        img.src = image.dataUri;
        img.alt = 'Mermaid diagram';
        img.width = image.width;
        img.height = image.height;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        pre.replaceWith(img);
      }
    } catch {
      // Keep the original fenced code readable when Mermaid or image conversion fails.
    }
  }
}

function isValidMermaidPng(image: { dataUri: string; width: number; height: number }): boolean {
  const base64 = image.dataUri.match(/^data:image\/png;base64,([a-z0-9+/]+={0,2})$/i)?.[1];
  const signature = base64 && base64.length % 4 === 0 ? atob(base64.slice(0, 12)) : '';
  const hasPngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
    .every((byte, index) => signature.charCodeAt(index) === byte);
  return hasPngSignature
    && Number.isFinite(image.width)
    && image.width > 0
    && Number.isFinite(image.height)
    && image.height > 0;
}

async function renderMermaidSvg(id: string, source: string): Promise<string> {
  // Match the editor's established settings so export parsing behaves the same
  // without changing the editor's code-block renderer or stored Markdown.
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', htmlLabels: false, theme: 'default' });
  const result = await mermaid.render(id, source);
  return result.svg;
}

function addMermaidAccessibility(svg: string, id: string, source: string): string {
  const svgDocument = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const diagram = svgDocument.documentElement;
  if (diagram.localName !== 'svg' || svgDocument.querySelector('parsererror')) throw new Error('Invalid Mermaid SVG');

  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const title = svgDocument.createElementNS('http://www.w3.org/2000/svg', 'title');
  title.id = titleId;
  title.textContent = 'Mermaid diagram';
  const description = svgDocument.createElementNS('http://www.w3.org/2000/svg', 'desc');
  description.id = descriptionId;
  description.textContent = `Diagram source: ${source.replace(/\s+/g, ' ').trim().slice(0, 400)}`;
  diagram.insertBefore(description, diagram.firstChild);
  diagram.insertBefore(title, description);
  diagram.setAttribute('role', 'img');
  diagram.setAttribute('aria-labelledby', titleId);
  diagram.setAttribute('aria-describedby', descriptionId);
  diagram.setAttribute('focusable', 'false');
  diagram.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  diagram.style.display = 'block';
  diagram.style.maxWidth = '100%';
  diagram.style.height = 'auto';
  return new XMLSerializer().serializeToString(diagram);
}

async function svgToPngDataUri(svg: string): Promise<{ dataUri: string; width: number; height: number }> {
  const svgDocument = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const diagram = svgDocument.documentElement;
  const viewBox = diagram.getAttribute('viewBox')?.trim().split(/[ ,]+/).map(Number) ?? [];
  const sourceWidth = viewBox.length === 4 && viewBox[2] > 0 ? viewBox[2] : 1200;
  const sourceHeight = viewBox.length === 4 && viewBox[3] > 0 ? viewBox[3] : 800;
  const scale = Math.min(1, 1600 / sourceWidth, 2400 / sourceHeight);
  const pixelWidth = Math.max(1, Math.round(sourceWidth * scale));
  const pixelHeight = Math.max(1, Math.round(sourceHeight * scale));
  diagram.setAttribute('width', String(pixelWidth));
  diagram.setAttribute('height', String(pixelHeight));

  const objectUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(diagram)], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Unable to load Mermaid SVG'));
      image.src = objectUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Unable to create diagram canvas');
    context.drawImage(image, 0, 0, pixelWidth, pixelHeight);
    const dataUri = canvas.toDataURL('image/png');
    return { dataUri, width: Math.min(620, pixelWidth), height: Math.max(1, Math.round(Math.min(620, pixelWidth) * pixelHeight / pixelWidth)) };
  } finally {
    URL.revokeObjectURL(objectUrl);
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

/** Source-pixel heights for non-overlapping PDF page crops. */
export function pdfSliceHeights(canvasHeight: number, pageSourceHeight: number): number[] {
  if (!Number.isFinite(canvasHeight) || !Number.isFinite(pageSourceHeight) || canvasHeight <= 0 || pageSourceHeight <= 0) return [];
  const slices: number[] = [];
  let remaining = canvasHeight;
  while (remaining > 0) {
    const slice = Math.min(pageSourceHeight, remaining);
    slices.push(slice);
    remaining -= slice;
  }
  return slices;
}

/** Map visible portions of safe anchors to annotations on one cropped PDF page. */
export function pdfLinkAnnotations(root: HTMLElement, options: PdfLinkMappingOptions): PdfLinkAnnotation[] {
  const { canvasWidth, canvasHeight, margin, imgWidth, sourceY, sliceHeight } = options;
  if (![canvasWidth, canvasHeight, margin, imgWidth, sourceY, sliceHeight].every(Number.isFinite)
    || canvasWidth <= 0 || canvasHeight <= 0 || imgWidth <= 0 || sliceHeight <= 0) return [];
  const rootRect = root.getBoundingClientRect();
  const scale = canvasWidth / rootRect.width;
  if (!Number.isFinite(scale) || scale <= 0) return [];
  const pageBottom = sourceY + sliceHeight;
  const annotations: PdfLinkAnnotation[] = [];
  for (const anchor of Array.from(root.querySelectorAll<HTMLAnchorElement>('a[href]'))) {
    const href = anchor.getAttribute('href')?.trim() ?? '';
    let url: URL;
    try {
      url = new URL(href, document.baseURI);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) continue;
    } catch {
      continue;
    }
    for (const rect of Array.from(anchor.getClientRects())) {
      const left = Math.max(0, (rect.left - rootRect.left) * scale);
      const right = Math.min(canvasWidth, (rect.right - rootRect.left) * scale);
      const top = Math.max(sourceY, (rect.top - rootRect.top) * scale);
      const bottom = Math.min(pageBottom, (rect.bottom - rootRect.top) * scale);
      if (right <= left || bottom <= top) continue;
      annotations.push({
        url: url.toString(),
        x: margin + (left / canvasWidth) * imgWidth,
        y: margin + ((top - sourceY) / canvasWidth) * imgWidth,
        width: ((right - left) / canvasWidth) * imgWidth,
        height: ((bottom - top) / canvasWidth) * imgWidth,
      });
    }
  }
  return annotations;
}

/** Resolve API-relative asset URLs and opt into CORS for permitted remote assets. */
export function normalizeExportImageSources(root: ParentNode, documentId?: string | null): void {
  for (const image of Array.from(root.querySelectorAll('img'))) {
    const source = image.getAttribute('src')?.trim();
    if (!source) {
      image.remove();
      continue;
    }
    if (/^(data:|blob:|https?:\/\/)/i.test(source)) {
      if (/^https?:\/\//i.test(source)) image.crossOrigin = 'anonymous';
      continue;
    }
    const base = environment.API_URL.replace(/\/$/, '');
    const assetPath = source.replace(/^\/+/, '');
    if (assetPath.startsWith('assets/') && documentId?.trim()) {
      image.src = `${base}/docs/${encodeURIComponent(documentId.trim())}/assets/${assetPath.slice('assets/'.length)}`;
    } else if (assetPath.startsWith('docs/')) {
      image.src = `${base}/${assetPath}`;
    } else if (assetPath.startsWith('/')) {
      image.src = `${base}/${assetPath}`;
    } else {
      image.remove();
      continue;
    }
    image.crossOrigin = 'anonymous';
  }
}

export function waitForExportImages(root: ParentNode, timeoutMs = 5000): Promise<void> {
  return Promise.all(
    Array.from(root.querySelectorAll('img')).map(
      (image) => new Promise<void>((resolve) => {
        if (image.complete && image.naturalWidth > 0) return resolve();
        image.addEventListener('load', () => resolve(), { once: true });
        image.addEventListener('error', () => { image.remove(); resolve(); }, { once: true });
        window.setTimeout(resolve, timeoutMs);
      }),
    ),
  ).then(() => undefined);
}

export async function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read image blob'));
    reader.readAsDataURL(blob);
  });
}

export async function inlineExportImages(root: ParentNode, documentId: string | null | undefined, fetchBlob: (url: string) => Promise<Blob>): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'));
  await Promise.all(images.map(async (image) => {
    const source = image.getAttribute('src')?.trim();
    if (!source || /^data:/i.test(source)) return;
    if (/^blob:/i.test(source)) return;
    let url = source;
    if (source.replace(/^\/+/, '').startsWith('assets/') && documentId?.trim()) {
      url = `${environment.API_URL.replace(/\/$/, '')}/docs/${encodeURIComponent(documentId.trim())}/assets/${source.replace(/^\/+/, '').slice(7)}`;
    } else if (!/^https?:\/\//i.test(source)) { image.remove(); return; }
    try {
      const blob = await fetchBlob(url);
      image.src = await blobToDataUri(blob);
    } catch { image.remove(); }
  }));
}
