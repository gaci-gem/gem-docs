import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { DocMetadata, DOC_METADATA_FIELDS } from '@core/interfaces/doc-metadata';

/**
 * Read-only modal that displays the `Doc.metadata` payload from the backend.
 *
 * The dialog receives a `metadata` input (nullable, undefined for unlinked docs)
 * and emits `closed` when the user dismisses it. It does NOT mutate metadata —
 * the backend's `updateMetadata` endpoint is the single source of truth and is
 * driven by the evento workflow listener, never by user actions here.
 *
 * Empty state: when metadata is undefined or all fields are null, we show a
 * single "Sin metadata" row so users immediately understand the doc isn't
 * linked to an evento. We don't fabricate a message — the absence is
 * information itself.
 */
@Component({
  selector: 'app-metadata-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogModule, ButtonModule],
  template: `
    <p-dialog
      [visible]="visible()"
      (visibleChange)="onVisibleChange($event)"
      header="Metadata del documento"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '560px', maxWidth: '95vw' }"
      styleClass="metadata-dialog"
    >
      @if (hasAnyValue()) {
        <div class="metadata-grid" role="list">
          @for (field of fields; track field.key) {
            @if (valueFor(field.key); as value) {
              <div class="metadata-row" role="listitem">
                <span class="metadata-label">{{ field.label }}</span>
                <span class="metadata-value">{{ value }}</span>
              </div>
            }
          }
        </div>
      } @else {
        <p class="metadata-empty">
          Este documento no está asociado a un evento. La metadata se completa
          automáticamente cuando se vincula a un evento.
        </p>
      }

      <ng-template pTemplate="footer">
        <p-button
          label="Cerrar"
          severity="secondary"
          [text]="true"
          (onClick)="close()"
        />
      </ng-template>
    </p-dialog>
  `,
  styles: [
    `
      :host { display: block; }

      .metadata-grid {
        display: grid;
        grid-template-columns: minmax(140px, 0.45fr) 1fr;
        gap: 0.5rem 1rem;
        font-size: 0.875rem;
      }

      .metadata-row {
        display: contents;
      }

      .metadata-label {
        color: var(--tt-text-secondary, #6b7280);
        font-weight: 500;
      }

      .metadata-value {
        color: var(--tt-text, #111827);
        word-break: break-word;
      }

      .metadata-empty {
        color: var(--tt-text-secondary, #6b7280);
        font-style: italic;
        margin: 0;
        line-height: 1.5;
      }
    `,
  ],
})
export class MetadataDialogComponent {
  /** Two-way visibility binding — parent passes a signal. */
  visible = input<boolean>(false);

  /** Metadata payload from the backend; null/undefined means no evento link. */
  metadata = input<DocMetadata | null | undefined>(null);

  /** Emits when the dialog is closed by any means (X button, Esc, footer). */
  closed = output<void>();

  /** Field descriptors (Spanish labels) imported from the shared interface. */
  protected readonly fields = DOC_METADATA_FIELDS;

  /**
   * Returns the trimmed value for a field, or null if missing/empty.
   * Exposed as a template helper so the `@if (valueFor(...); as value)` block
   * skips empty fields entirely instead of rendering a placeholder.
   */
  protected valueFor(key: keyof DocMetadata): string | null {
    const raw = this.metadata()?.[key];
    if (raw === null || raw === undefined) return null;
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  /** True when at least one field has a non-empty value. */
  protected hasAnyValue(): boolean {
    const m = this.metadata();
    if (!m) return false;
    return this.fields.some((f) => this.valueFor(f.key) !== null);
  }

  close(): void {
    this.closed.emit();
  }

  onVisibleChange(next: boolean): void {
    if (!next) this.closed.emit();
  }
}
