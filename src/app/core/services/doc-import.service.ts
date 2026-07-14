import { Injectable } from '@angular/core';
import { Observable, defer, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import * as mammoth from 'mammoth';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

export interface DocImportResult {
  /**
   * Markdown with image references as base64 data URIs (`![alt](data:...)`).
   * Callers should upload images via ImageUploadService and replace the
   * data URIs with server URLs before persisting.
   */
  markdown: string;
  /** Original HTML (sanitized, with base64 images) for the iframe preview */
  htmlPreview: string;
  /** Filename without extension — suggested as doc title */
  suggestedTitle: string;
  /** Non-fatal warnings from mammoth (e.g. unsupported elements) */
  warnings: string[];
  /** Original file size in bytes */
  sizeBytes: number;
  /**
   * Ordered list of base64 data URIs for every image in the document, in
   * the same order they appear in `markdown`. Use this to upload images
   * on confirm and replace them with server URLs.
   */
  imagesBase64: string[];
}

export interface DocImportError {
  message: string;
  cause?: unknown;
}

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB safety cap
const ACCEPTED_EXTENSIONS = ['.docx'];
const ACCEPTED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/octet-stream',
];

/**
 * Imports .docx files into markdown for the Tiptap editor (markdown-first).
 *
 * Pipeline:
 * 1. mammoth converts .docx → HTML with inline base64 images
 * 2. We collect every base64 image data URI into `imagesBase64` (so callers
 *    can upload them later, on user confirmation — NOT during preview)
 * 3. The HTML is sanitized for safe iframe rendering (scripts stripped)
 * 4. turndown converts the HTML → markdown (with base64 data URIs)
 * 5. We return the markdown + base64 list + sanitized HTML preview
 *
 * Image upload happens in the dialog's confirm handler, not here — this
 * keeps preview fast and lets the user back out without polluting the
 * server with orphan uploads.
 */
@Injectable({ providedIn: 'root' })
export class DocImportService {
  /**
   * Reads a File, parses it with mammoth, and returns markdown + base64
   * image list + html preview. Throws a `DocImportError` if the file is
   * invalid, too large, or unparseable.
   */
  importFromFile(file: File): Observable<DocImportResult> {
    try {
      this.validateFile(file);
    } catch (err) {
      throw err;
    }

    const originalSize = file.size;
    const fileName = file.name;

    return defer(() => from(this.runPipeline(file, fileName))).pipe(
      map((partial) => ({ ...partial, sizeBytes: originalSize })),
      catchError((err) => {
        throw {
          message: this.toErrorMessage(err),
          cause: err,
        } satisfies DocImportError;
      }),
    );
  }

  private async runPipeline(
    file: File,
    fileName: string,
  ): Promise<Omit<DocImportResult, 'sizeBytes'>> {
    const arrayBuffer = await file.arrayBuffer();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mammothLib = mammoth as any;
    const mammothResult = await mammothLib.convertToHtml(
      { arrayBuffer },
      {
        // Keep images inline as data URIs so we can extract and upload them later
        convertImage: mammothLib.images.dataUri,
      },
    );

    const rawHtml: string = mammothResult.value || '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const warnings: string[] = (mammothResult.messages ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicitany
      .filter((m: any) => m.type === 'warning')
      // eslint-disable-next-line @typescript-eslint/no-explicitany
      .map((m: any) => m.message as string);

    // Collect base64 image data URIs from the HTML, in order of appearance.
    // No upload here — caller does that on user confirmation.
    const imagesBase64 = this.extractBase64Images(rawHtml);

    // Sanitize HTML for safe iframe preview (no scripts, no event handlers,
    // no Office-specific tags that browsers try to execute). Browsers handle
    // Word's `<o:p>`/`<p>&nbsp;</p>` cruft fine in the preview, so we keep it.
    const safeHtml = this.sanitizeHtmlForPreview(rawHtml);

    // For markdown conversion, we need a CLEANER HTML: turndown's GFM table
    // plugin fails on Word-style cells (`<td><p>X</p></td>`) and on tags it
    // doesn't recognize (`<o:p>`, `<v:*>`, `class="MsoNormal"`). Without this
    // pre-processing the table either gets dropped or breaks into multi-line
    // cells that marked can't parse back into a Tiptap table.
    const cleanHtml = this.cleanHtmlForMarkdown(rawHtml);

    // HTML → markdown. Base64 data URIs in image src are preserved as-is in
    // the markdown — the caller will replace them with server URLs on confirm.
    const turndown = new TurndownService({
      headingStyle: 'atx',       // # Heading 1
      codeBlockStyle: 'fenced',  // ```code```
      bulletListMarker: '-',
      emDelimiter: '_',
    });
    // Enable GitHub-Flavored Markdown: tables, strikethrough, task lists.
    // Without this, turndown leaves <table> as raw HTML, which
    // tiptap-markdown's `html: false` config drops on parse.
    turndown.use(gfm);
    const markdown = turndown.turndown(cleanHtml);

    return {
      markdown,
      htmlPreview: safeHtml,
      suggestedTitle: this.stripExtension(fileName),
      warnings,
      imagesBase64,
    };
  }

  /**
   * Walk the HTML and collect every `<img>` src that starts with `data:`,
   * preserving order of appearance. No upload happens here.
   */
  private extractBase64Images(html: string): string[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const imgs = Array.from(doc.querySelectorAll('img[src^="data:"]'));
    return imgs
      .map((img) => img.getAttribute('src') || '')
      .filter((src) => src.length > 0);
  }

  /**
   * Strip dangerous content from the HTML before showing it in an iframe.
   * Even with `sandbox=""`, browsers report blocked script attempts in the
   * console — these regexes eliminate those attempts entirely.
   */
  private sanitizeHtmlForPreview(html: string): string {
    return html
      // <script> tags
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      // Office-specific script-like tags
      .replace(/<o:script\b[^>]*>[\s\S]*?<\/o:script>/gi, '')
      // Inline event handlers (onclick, onload, onerror, etc.)
      .replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      // javascript: URLs in href/src
      .replace(/(href|src)\s*=\s*("javascript:[^"]*"|'javascript:[^']*')/gi, '$1=""');
  }

  /**
   * Restructure mammoth's HTML into something turndown's GFM table plugin
   * can actually parse. Browsers happily render Word's `<o:p>`, `class="Mso..."`
   * and `<td><p>X</p></td>` structure — but turndown-table-plugin falls through
   * to raw HTML output when it sees unknown tags, and marked later breaks on
   * multi-line cells. After this pass the table is plain `<table>/<thead>/<tbody>/<tr>/<th>/<td>`
   * with text directly inside cells, which turndown+marked round-trip cleanly.
   */
  private cleanHtmlForMarkdown(html: string): string {
    let cleaned = html;
    // Strip Office namespace tags: <o:p>, <v:shape>, <w:br>, <xml>, etc.
    cleaned = cleaned.replace(/<\/?(?:o|v|w|xml)(?::\w+)?[^>]*>/gi, '');
    // Remove empty paragraphs (`<p></p>`, `<p>&nbsp;</p>`, with optional attrs).
    // Word uses these as spacing placeholders inside table cells.
    cleaned = cleaned.replace(/<p\b[^>]*>(?:\s|&nbsp;)*<\/p>/gi, '');
    // Drop Word-only attributes that add noise without semantic value.
    cleaned = cleaned.replace(/\s+class="[^"]*"/gi, '');
    cleaned = cleaned.replace(/\s+style="[^"]*"/gi, '');
    // Convert non-breaking spaces to regular spaces (markdown doesn't need them).
    cleaned = cleaned.replace(/&nbsp;/g, ' ');
    // Flatten `<p>` wrappers inside table cells. OOXML requires every table
    // cell to contain block-level content (usually `<p>`), but turndown-gfm
    // tables need the cell text on a single line for pipe-delimited syntax.
    // Multiple `<p>` siblings are joined with a single space.
    cleaned = cleaned.replace(
      /<(td|th)\b[^>]*>([\s\S]*?)<\/\1>/gi,
      (_match, tag: string, content: string) =>
        `<${tag}>${content.replace(/<p\b[^>]*>/gi, '').replace(/<\/p>/gi, ' ').trim()}</${tag}>`,
    );
    // Promote the first `<tr>` of every table to `<th>` cells when the table
    // has no `<th>` at all. turndown-plugin-gfm's `tables` rule ONLY converts
    // tables whose first row contains `<th>` — Word/mammoth tables use
    // `<td><strong>X</strong></td>` for header rows, so without this promotion
    // the table is silently dropped (kept as raw HTML) and never reaches the
    // editor. Promoting the first row matches the GFM convention anyway.
    cleaned = cleaned.replace(
      /<table\b[^>]*>([\s\S]*?)<\/table>/gi,
      (match: string, content: string) => {
        if (/<th\b/i.test(content)) return match;
        return (
          '<table>' +
          content.replace(
            /(<tr\b[^>]*>)([\s\S]*?)(<\/tr>)/i,
            (_trMatch: string, open: string, trContent: string, close: string) =>
              `${open}${trContent.replace(/<td\b/gi, '<th')}${close}`,
          ) +
          '</table>'
        );
      },
    );
    return cleaned;
  }

  private validateFile(file: File): void {
    const lowerName = file.name.toLowerCase();
    const hasValidExt = ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    const hasValidMime = ACCEPTED_MIME_TYPES.includes(file.type);

    if (!hasValidExt && !hasValidMime) {
      throw {
        message: `Solo se aceptan archivos .docx. Recibido: "${file.name}" (${file.type || 'tipo desconocido'})`,
      } satisfies DocImportError;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / 1024 / 1024).toFixed(1);
      throw {
        message: `El archivo es demasiado grande (${sizeMb} MB). Máximo permitido: 25 MB.`,
      } satisfies DocImportError;
    }

    if (file.size === 0) {
      throw {
        message: 'El archivo está vacío.',
      } satisfies DocImportError;
    }
  }

  private stripExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot > 0 ? fileName.slice(0, lastDot) : fileName;
  }

  private toErrorMessage(err: unknown): string {
    if (err && typeof err === 'object' && 'message' in err) {
      return String((err as { message: unknown }).message);
    }
    return 'Error desconocido al importar el archivo.';
  }
}
