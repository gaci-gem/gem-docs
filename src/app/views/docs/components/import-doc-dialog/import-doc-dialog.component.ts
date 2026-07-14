import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  output,
  input,
  ViewChild,
  ElementRef,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { SelectButtonModule } from 'primeng/selectbutton';
import { firstValueFrom } from 'rxjs';
import { DocImportService, DocImportResult } from '@core/services/doc-import.service';
import { ImageUploadService } from '@core/services/image-upload.service';

export type ImportMode = 'replace' | 'append';

export interface ImportPayload {
  markdown: string;
  suggestedTitle: string;
  mode: ImportMode;
}

const MODE_OPTIONS = [
  { label: 'Reemplazar', value: 'replace', icon: 'pi pi-replay' },
  { label: 'Insertar al final', value: 'append', icon: 'pi pi-arrow-down' },
];

/**
 * Modal dialog for importing a .docx file into the editor.
 *
 * Flow:
 * 1. User picks file (click or drag-drop)
 * 2. We parse with mammoth → markdown + base64 image list (NO server upload)
 * 3. Preview shown in sandboxed iframe (uses base64, always renders)
 * 4. User picks mode: replace or append
 * 5. On confirm: upload images to backend → replace base64 with server URLs
 *    in the markdown → emit final payload to parent
 *
 * Why upload on confirm, not on parse: user might cancel and we don't want
 * orphan images on the server; preview with base64 is instant and works
 * regardless of network/backend state.
 */
@Component({
  selector: 'app-import-doc-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    ProgressSpinnerModule,
    MessageModule,
    SelectButtonModule,
  ],
  template: `
    <p-dialog
      [visible]="visible()"
      (visibleChange)="onVisibleChange($event)"
      header="Importar documento de Word"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '720px', maxWidth: '95vw' }"
      styleClass="import-doc-dialog"
      (onHide)="reset()"
    >
      <!-- File picker + drop zone (always visible) -->
      <div
        class="picker-row"
        [class.is-dragover]="isDragOver()"
        (dragenter)="onDragEnter($event)"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
      >
        <label class="picker-label">
          <input
            #fileInput
            type="file"
            accept=".docx"
            (change)="onFileSelected($event)"
            hidden
          />
          <i class="pi" [class.pi-upload]="!isDragOver()" [class.pi-cloud-download]="isDragOver()"></i>
          <span>{{ pickerText() }}</span>
        </label>
        @if (selectedFile(); as f) {
          <span class="file-size">{{ formatSize(f.size) }}</span>
        }
      </div>

      <!-- Parsing state -->
      @if (parsing()) {
        <div class="state-row">
          <p-progressSpinner styleClass="w-3rem h-3rem" strokeWidth="3" />
          <span>Parseando el documento...</span>
        </div>
      }

      <!-- Error state -->
      @if (errorMessage(); as msg) {
        <p-message severity="error" [text]="msg" styleClass="w-full" />
      }

      <!-- Success state — preview + warnings + mode picker -->
      @if (result(); as r) {
        @if (r.warnings.length > 0) {
          <p-message
            severity="warn"
            [text]="r.warnings.length + ' advertencia(s) — algunos elementos pueden no haberse convertido correctamente.'"
            styleClass="w-full"
          />
        }
        @if (r.imagesBase64.length > 0) {
          <p-message
            severity="info"
            [text]="r.imagesBase64.length + ' imagen(es) detectada(s) — se subirán al confirmar.'"
            styleClass="w-full"
          />
        }

        <div class="preview-header">
          <strong>Vista previa:</strong>
          <span class="preview-title">{{ r.suggestedTitle }}</span>
        </div>

        <iframe
          #previewFrame
          class="preview-frame"
          [srcdoc]="r.htmlPreview"
          sandbox=""
          title="Vista previa del documento importado"
        ></iframe>

        <div class="mode-row">
          <span class="mode-label">Modo de import:</span>
          <p-selectButton
            [options]="modeOptions"
            [ngModel]="mode()"
            (ngModelChange)="mode.set($event)"
            optionLabel="label"
            optionValue="value"
            [allowEmpty]="false"
          />
        </div>
      }

      <!-- Uploading state (during confirm) -->
      @if (uploading()) {
        <div class="state-row">
          <p-progressSpinner styleClass="w-3rem h-3rem" strokeWidth="3" />
          <span>
            Subiendo imágenes ({{ uploadedCount() }}/{{ totalImages() }})...
          </span>
        </div>
      }

      <!-- Footer actions -->
      <ng-template pTemplate="footer">
        <p-button
          label="Cancelar"
          severity="secondary"
          [text]="true"
          (onClick)="cancel()"
          [disabled]="parsing() || uploading()"
        />
        <p-button
          [label]="confirmLabel()"
          [icon]="uploading() ? 'pi pi-spin pi-spinner' : 'pi pi-file-import'"
          (onClick)="confirm()"
          [disabled]="!result() || parsing() || uploading()"
        />
      </ng-template>
    </p-dialog>
  `,
  styles: [
    `
      :host { display: block; }

      .picker-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.75rem;
        border: 2px dashed var(--tt-border, #d1d5db);
        border-radius: 0.5rem;
        background: var(--tt-surface-low, #f9fafb);
        margin-bottom: 1rem;
        transition: border-color 0.15s ease, background 0.15s ease;
      }

      .picker-row.is-dragover {
        border-color: var(--tt-primary, #144373);
        background: var(--tt-surface, #ffffff);
        box-shadow: inset 0 0 0 1px var(--tt-primary, #144373);
      }

      .picker-label {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        color: var(--tt-primary, #144373);
        font-weight: 500;
        user-select: none;
        flex: 1;
        min-width: 0;
      }

      .picker-label i { font-size: 1.1rem; }
      .picker-label span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .file-size {
        font-size: 0.8125rem;
        color: var(--tt-text-secondary, #6b7280);
        white-space: nowrap;
      }

      .state-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 0;
        color: var(--tt-text-secondary, #6b7280);
      }

      .preview-header {
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
        margin: 0.75rem 0 0.5rem;
        font-size: 0.875rem;
      }

      .preview-title {
        color: var(--tt-text-secondary, #6b7280);
        font-style: italic;
      }

      .preview-frame {
        width: 100%;
        height: 320px;
        border: 1px solid var(--tt-border, #e5e7eb);
        border-radius: 0.375rem;
        background: white;
      }

      .mode-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-top: 0.75rem;
      }

      .mode-label {
        font-size: 0.875rem;
        color: var(--tt-text-secondary, #6b7280);
      }
    `,
  ],
})
export class ImportDocDialogComponent {
  private docImport = inject(DocImportService);
  private imageUpload = inject(ImageUploadService);

  /** Two-way visibility binding — parent passes a signal/getter */
  visible = input<boolean>(false);

  /** Emits when the user confirms the import (after image upload) */
  imported = output<ImportPayload>();

  /** Emits when the dialog is closed (either confirm or cancel) */
  cancelled = output<void>();

  /** Default import mode — set by parent if it wants different default */
  defaultMode = input<ImportMode>('replace');

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  protected readonly modeOptions = MODE_OPTIONS;

  // Local state
  protected selectedFile = signal<File | null>(null);
  protected parsing = signal(false);
  protected result = signal<DocImportResult | null>(null);
  protected errorMessage = signal<string | null>(null);
  protected isDragOver = signal(false);
  protected mode = signal<ImportMode>('replace');
  protected uploading = signal(false);
  protected uploadedCount = signal(0);
  protected totalImages = signal(0);

  /**
   * In-flight cancellation flag for the async confirm() loop. If the user
   * clicks Cancel mid-upload, this stops further uploads and prevents the
   * final `imported` emission from racing past the cancel.
   */
  private confirmCancelled = false;

  // Sync defaultMode input → mode signal whenever parent changes it
  constructor() {
    effect(() => {
      this.mode.set(this.defaultMode());
    });
  }

  // ── File selection (picker + drag/drop) ──────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.processFile(file);
  }

  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    const related = event.relatedTarget as Node | null;
    if (related && target.contains(related)) return;
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.processFile(file);
  }

  private processFile(file: File): void {
    this.selectedFile.set(file);
    this.result.set(null);
    this.errorMessage.set(null);
    this.mode.set(this.defaultMode());
    this.parsing.set(true);

    this.docImport.importFromFile(file).subscribe({
      next: (res) => {
        this.result.set(res);
        this.parsing.set(false);
      },
      error: (err: { message?: string }) => {
        this.errorMessage.set(err?.message ?? 'Error desconocido al importar.');
        this.parsing.set(false);
      },
    });
  }

  // ── Picker label ──────────────────────────────────────────────────────

  protected pickerText(): string {
    if (this.isDragOver()) return 'Soltá el archivo acá';
    return this.selectedFile()?.name ?? 'Seleccionar o arrastrar archivo .docx';
  }

  // ── Confirm / cancel ──────────────────────────────────────────────────

  protected confirmLabel(): string {
    if (this.uploading()) return 'Subiendo...';
    return this.mode() === 'append' ? 'Agregar al final' : 'Reemplazar contenido';
  }

  /**
   * Confirm handler — uploads images (if any), then emits the final payload.
   * Sequential uploads so we can show progress and keep errors localized.
   */
  async confirm(): Promise<void> {
    const r = this.result();
    if (!r) return;

    this.confirmCancelled = false;
    this.errorMessage.set(null);

    let finalMarkdown = r.markdown;

    if (r.imagesBase64.length > 0) {
      this.uploading.set(true);
      this.totalImages.set(r.imagesBase64.length);
      this.uploadedCount.set(0);

      try {
        for (let i = 0; i < r.imagesBase64.length; i++) {
          if (this.confirmCancelled) {
            this.uploading.set(false);
            return;
          }
          const dataUri = r.imagesBase64[i];
          const uploadRes = await firstValueFrom(
            this.imageUpload.uploadBase64(dataUri, `imported-${i}`),
          );
          // Replace the base64 data URI in the markdown with the server URL.
          // Data URIs can be long, so use split/join instead of a single
          // .replace() to handle multiple occurrences safely.
          finalMarkdown = finalMarkdown.split(dataUri).join(uploadRes.url);
          this.uploadedCount.set(i + 1);
        }
      } catch (err) {
        this.errorMessage.set(
          (err as { message?: string })?.message ?? 'Error al subir imágenes.',
        );
        this.uploading.set(false);
        return; // Don't emit — user can retry or cancel
      }

      if (this.confirmCancelled) {
        this.uploading.set(false);
        return;
      }
      this.uploading.set(false);
    }

    this.imported.emit({
      markdown: finalMarkdown,
      suggestedTitle: r.suggestedTitle,
      mode: this.mode(),
    });
    this.reset();
  }

  cancel(): void {
    this.confirmCancelled = true;
    this.cancelled.emit();
    this.reset();
  }

  onVisibleChange(next: boolean): void {
    if (!next) {
      this.cancelled.emit();
      this.reset();
    }
  }

  reset(): void {
    this.selectedFile.set(null);
    this.parsing.set(false);
    this.result.set(null);
    this.errorMessage.set(null);
    this.isDragOver.set(false);
    this.uploading.set(false);
    this.uploadedCount.set(0);
    this.totalImages.set(0);
    this.mode.set(this.defaultMode());
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
}
