import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
} from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import {
  DocMetadata,
  DOC_METADATA_FIELDS,
  UsuarioActualMeta,
} from '@core/interfaces/doc-metadata';
import { modalConfig } from '../../../../types/modals';

/**
 * Read-only modal that displays the `Doc.metadata` payload from the backend.
 *
 * The dialog receives a `metadata` input and emits `visibleChange(false)` when
 * the user dismisses it (X button, Esc key, footer button, or backdrop click).
 * It does NOT mutate metadata — the backend's `updateMetadata` column is the
 * single source of truth and is driven by the evento workflow listener.
 *
 * All 9 fields declared in `DOC_METADATA_FIELDS` are rendered unconditionally.
 * Null / undefined / whitespace-only values display as `—` (em-dash), per
 * spec R17. The dialog uses `modalConfig` (width + breakpoints) so it scales
 * consistently with the rest of the app's modals (CRITICAL fix).
 *
 * `usuarioActual` is a special cell: when populated, it renders the full name
 * alongside a `<p-tag>` badge with `@<usuario>` painted with the user's `color`
 * as background. When `null` (or a legacy string from pre-migration data),
 * it renders `—` like every other null field — see `usuarioActualSafe`.
 */
@Component({
  selector: 'app-metadata-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogModule, ButtonModule, TagModule],
  template: `
    <p-dialog
      [visible]="visible()"
      (visibleChange)="onVisibleChange($event)"
      header="Metadata del documento"
      [modal]="modalConfig.modal"
      [closable]="modalConfig.closable"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: modalConfig.width }"
      [breakpoints]="modalConfig.breakpoints"
      styleClass="metadata-dialog"
    >
      <div class="metadata-grid" role="list">
        @for (field of fields; track field.key) {
          <div class="metadata-row" role="listitem">
            <span class="metadata-label">{{ field.label }}</span>
            @if (field.key === 'usuarioActual') {
              <span class="metadata-value metadata-value--user">
                @if (usuarioActualSafe(); as user) {
                  <span class="user-name">{{ user.nombre }}</span>
                  <p-tag
                    class="user-badge"
                    [value]="'@' + user.usuario"
                    [style]="{ background: user.color, color: '#fff' }"
                  />
                } @else {
                  —
                }
              </span>
            } @else {
              <span class="metadata-value">{{ displayValue(field.key) }}</span>
            }
          </div>
        }
      </div>

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

      .metadata-value--user {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .user-name {
        color: var(--tt-text, #111827);
      }

      .user-badge {
        font-size: 0.75rem;
        padding: 0.125rem 0.5rem;
      }
    `,
  ],
})
export class MetadataDialogComponent {
  /** Two-way visibility binding — parent passes a signal. */
  visible = input<boolean>(false);

  /** Metadata payload from the backend (all 9 keys, each nullable). */
  metadata = input<DocMetadata | null | undefined>(null);

  /**
   * Emits the dialog's next visibility state. PrimeNG's `visibleChange`
   * already fires with a boolean; we re-emit it on our own close actions
   * (footer button) so the parent can drive its `showMetadataDialog`
   * signal in a single binding.
   */
  visibleChange = output<boolean>();

  /** Field descriptors (Spanish labels) imported from the shared interface. */
  protected readonly fields = DOC_METADATA_FIELDS;

  /** Shared modal configuration from `types/modals.ts`. */
  protected readonly modalConfig = modalConfig;

  /**
   * Normalized `usuarioActual` cell value. Returns `null` when:
   *   - the metadata is `null`/`undefined`,
   *   - `usuarioActual` itself is `null`/`undefined`,
   *   - or `usuarioActual` is a legacy STRING (pre-migration docs stored
   *     the full name as a plain string — the modal falls back to `—`
   *     instead of crashing on `user.nombre` of a primitive).
   *
   * Backed by a `computed` so the template stays free of inline type
   * guards and reads the value once per render cycle.
   */
  protected readonly usuarioActualSafe = computed<UsuarioActualMeta | null>(
    () => {
      const raw = this.metadata()?.usuarioActual;
      if (raw === null || raw === undefined) return null;
      if (typeof raw !== 'object') return null;
      return raw;
    },
  );

  /**
   * Resolves the displayed value for a non-special field.
   *
   * - `null` / `undefined` → em-dash placeholder.
   * - whitespace-only strings → trimmed empty → em-dash.
   * - any other string → returned trimmed so the grid stays tidy.
   *
   * Not used for `usuarioActual` — that field has its own rich cell
   * rendered from `usuarioActualSafe`.
   */
  protected displayValue(key: keyof DocMetadata): string {
    const raw = this.metadata()?.[key];
    if (raw === null || raw === undefined) return '—';
    if (typeof raw !== 'string') return '—';
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : '—';
  }

  /** Whether the dialog should announce a close on the next emission. */
  private wantsClose = computed(() => !this.visible());

  close(): void {
    this.visibleChange.emit(false);
  }

  onVisibleChange(next: boolean): void {
    if (!next) this.visibleChange.emit(false);
  }
}
