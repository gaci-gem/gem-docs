import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ImageLightboxService } from '@core/services/image-lightbox.service';

/**
 * Full-screen image overlay. Renders nothing when closed; renders a dark
 * backdrop + centered image when an URL is set via ImageLightboxService.
 *
 * The lightbox is mounted at the app root (via doc-editor.component.ts)
 * with `position: fixed` so it escapes any container's `overflow: hidden`
 * — important for editor views that constrain their content area.
 *
 * UX:
 *   - Click on backdrop → close.
 *   - Click on the image → no-op (so dragging the image feels natural).
 *   - ESC key → close.
 *   - Close button (top-right) → close.
 */
@Component({
  selector: 'app-image-lightbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  template: `
    @if (imageUrl(); as url) {
      <div
        class="lightbox-backdrop"
        role="dialog"
        aria-modal="true"
        aria-label="Imagen ampliada"
        (click)="close()">
        <button
          type="button"
          class="lightbox-close"
          title="Cerrar (Esc)"
          aria-label="Cerrar"
          (click)="close(); $event.stopPropagation()">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
        <img
          [src]="url"
          class="lightbox-image"
          alt="Imagen ampliada"
          (click)="$event.stopPropagation()" />
      </div>
    }
  `,
  styles: `
    .lightbox-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: zoom-out;
      animation: lightbox-fade-in 0.15s ease-out;
    }
    .lightbox-image {
      max-width: 95vw;
      max-height: 95vh;
      object-fit: contain;
      cursor: default;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      border-radius: 4px;
      animation: lightbox-zoom-in 0.2s ease-out;
    }
    .lightbox-close {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.15s;
      z-index: 1;
    }
    .lightbox-close:hover,
    .lightbox-close:focus-visible {
      background: rgba(255, 255, 255, 0.2);
      outline: none;
    }
    @keyframes lightbox-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes lightbox-zoom-in {
      from { transform: scale(0.92); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `,
})
export class ImageLightboxComponent {
  private lightbox = inject(ImageLightboxService);

  // Expose the signal to the template directly.
  protected readonly imageUrl = this.lightbox.imageUrl;
  protected readonly close = () => this.lightbox.close();

  /**
   * Close on Escape. Bound via the component's `host` object so we don't
   * need the @HostListener decorator (per AGENTS.md).
   */
  onEscape(): void {
    if (this.imageUrl() !== null) {
      this.close();
    }
  }
}
