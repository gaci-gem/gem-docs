import { Injectable, signal } from '@angular/core';

/**
 * Drives the image lightbox (full-screen image viewer). Any component can
 * call `open(url)` to display an image full-screen; the lightbox
 * component observes the `imageUrl` signal and renders itself when set.
 *
 * Kept separate from any specific editor/viewer so the same lightbox can
 * be reused from any context (editor, preview iframe, doc list thumbnails,
 * etc.) — call `open()` with the URL you want to show.
 */
@Injectable({ providedIn: 'root' })
export class ImageLightboxService {
  /** URL of the image currently shown in the lightbox, or null when closed. */
  readonly imageUrl = signal<string | null>(null);

  open(url: string): void {
    if (!url) return;
    this.imageUrl.set(url);
  }

  close(): void {
    this.imageUrl.set(null);
  }
}
