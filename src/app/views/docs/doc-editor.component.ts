import { Component, ChangeDetectionStrategy, inject, signal, DestroyRef, ViewChild, ElementRef, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { DocService } from '@core/services/doc.service';
import { EspacioService } from '@core/services/espacio.service';
import { AuthService } from '@core/services/auth';
import { UserStorageService } from '@core/services/user-storage';
import { DocExportService } from '@core/services/doc-export.service';
import { ToolbarService } from '../../components/toolbar/toolbar.service';
import { EditorComponent, TiptapConfig } from '../../components/editor/editor.component';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { ImportDocDialogComponent } from './components/import-doc-dialog/import-doc-dialog.component';
import { MetadataDialogComponent } from './components/metadata-dialog/metadata-dialog.component';
import { ImageLightboxComponent } from '../../components/image-lightbox/image-lightbox.component';
import { Espacio } from '@core/interfaces/espacio';
import { DocMetadata } from '@core/interfaces/doc-metadata';

/**
 * Fallback metadata for a doc that the backend hasn't populated yet (no
 * evento link yet). Renders as 9 em-dash rows in the modal — better UX
 * than the previous `null` branch which showed an "empty state" message
 * that no longer exists after the R17 fix.
 *
 * Kept in lockstep with the backend's `DocsMetadata` shape; the spec suite
 * in `metadata-dialog.component.spec.ts` covers the contract.
 */
const EMPTY_METADATA: DocMetadata = {
  cliente: null,
  producto: null,
  modulo: null,
  proyecto: null,
  etapaActual: null,
  usuarioActual: null,
  eventoCode: null,
  titulo: null,
  eventoId: null,
};
import { MenuItem } from 'primeng/api';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, debounceTime, Subject } from 'rxjs';
import { showError, showInfo } from '../../utils/message-utils';

@Component({
  selector: 'app-doc-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EditorComponent, ToolbarComponent, ImportDocDialogComponent, MetadataDialogComponent, ImageLightboxComponent, RouterLink, BreadcrumbModule],
  styleUrl: './doc-editor.component.scss',
  template: `
    <div class="doc-editor-page">
      <!-- Breadcrumb -->
      <p-breadcrumb [model]="breadcrumbItems()" [home]="breadcrumbHome" />

      <!-- Toolbar — thin bar at top -->
      <app-toolbar
        (save)="save()"
        (importDoc)="openImportDialog()"
        (exportDocx)="exportDocx()"
        (exportPdf)="exportPdf()"
        (viewMetadata)="openMetadataDialog()"
      />

      <!-- Infinite page surface — scrolls as one -->
      <div class="doc-surface">
        <div class="doc-surface-inner">
          <!-- Title inline — part of the document, not a separate input -->
          <div
            #titleEl
            class="doc-title"
            contenteditable
            (input)="onTitleInput($event)"
            (keydown.enter)="$event.preventDefault()"
            data-placeholder="Sin título"
          ></div>

          <!-- Editor flows naturally after the title -->
          <app-editor
            [initialContent]="contenido()"
            (contentChange)="onContentChange($event)"
          />
        </div>
      </div>

      </div>

    <!-- Import .docx dialog -->
    <app-import-doc-dialog
      [visible]="showImportDialog()"
      (imported)="onImportConfirm($event)"
    />

    <!-- Metadata dialog — read-only view of Doc.metadata. Guarded by
         currentDoc() — we never open it before a doc has loaded, so the
         dialog always shows real data or the 9 em-dash rows for an empty
         payload (R17 fix: null fields render as em-dash, not skipped). -->
    <app-metadata-dialog
      [visible]="showMetadataDialog()"
      [metadata]="currentMetadata()"
      (visibleChange)="showMetadataDialog.set($event)"
    />

    <!-- Image lightbox overlay (opens when user clicks an image in the editor) -->
    <app-image-lightbox />
  `,
})
export class DocEditorComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private docService = inject(DocService);
  private espacioService = inject(EspacioService);
  private authService = inject(AuthService);
  private userStorage = inject(UserStorageService);
  private toolbarService = inject(ToolbarService);
  private messageService = inject(MessageService);
  private exportService = inject(DocExportService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('titleEl', { static: true }) titleEl!: ElementRef<HTMLElement>;

  docId: string | null = null;
  titulo = '';
  espacioId = '';
  contenido = signal('');
  saving = signal(false);
  creatingSpace = signal(false);
  espacios = signal<Espacio[]>([]);
  detectedLinks = signal<string[]>([]);
  showNewSpace = signal(false);
  showImportDialog = signal(false);
  showMetadataDialog = signal(false);
  /** Loaded doc payload (null while loading or when creating a new doc). */
  currentDoc = signal<{ id: string; metadata: DocMetadata } | null>(null);
  /** Convenience computed — feeds the metadata dialog input. */
  currentMetadata = computed(() => this.currentDoc()?.metadata ?? EMPTY_METADATA);
  newSpaceName = '';
  autor = toSignal(this.authService.currentUser$, { initialValue: null });
  espacioNombre = signal('');
  breadcrumbItems = signal<MenuItem[]>([]);
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/home' };

  private autoSaveSubject = new Subject<void>();

  constructor() {
    document.body.classList.add('editing-doc');
    this.loadSpaces();

    // Subscribe to route param changes to handle navigation between docs.
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const newId = params.get('id');
      if (newId !== this.docId) {
        this.docId = newId;
        if (this.docId) {
          this.loadDoc(this.docId);
        } else {
          // New doc mode - reset fields
          this.titulo = '';
          this.contenido.set('');
          this.titleEl.nativeElement.innerText = '';
          // No loaded doc yet — metadata dialog will show empty state if opened.
          this.currentDoc.set(null);
        }
      }
    });

    // Query params for espacioId when creating a new doc in a specific space.
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(queryParams => {
      const espacioId = queryParams.get('espacioId');
      if (espacioId && !this.espacioId) {
        this.espacioId = espacioId;
      }
    });

    // Auto-save: debounce 5 seconds after last content change (invisible to user)
    this.autoSaveSubject.pipe(
      debounceTime(5000),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.autoSave());

    this.toolbarService.setSaveStatus('idle');

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      document.body.classList.remove('editing-doc');
      this.autoSaveSubject.complete();
    });
  }

  onTitleInput(event: Event): void {
    const el = event.target as HTMLElement;
    this.titulo = el.innerText || '';
  }

  private loadDoc(id: string): void {
    this.docService.getById(id).subscribe({
      next: (doc) => {
        this.titulo = doc.titulo;
        this.titleEl.nativeElement.innerText = doc.titulo;
        this.contenido.set(doc.content);
        this.espacioId = doc.espacioId;
        // Store the loaded doc so the metadata dialog can read its payload
        // without re-hitting the backend. Updates here cover the caso of a
        // brand-new doc just created via POST. metadata is required on Doc
        // (spec R15); backend always returns it (default `{}`), so we trust
        // the payload directly.
        this.currentDoc.set({ id: doc.id, metadata: doc.metadata });
        this.loadEspacioNombre(doc.espacioId);
        this.parseLinks(doc.content);
      },
      error: () => showError(this.messageService, 'Error', 'No se pudo cargar el documento')
    });
  }

  loadSpaces(): void {
    this.espacioService.list().subscribe({
      next: (espacios) => {
        this.espacios.set(espacios);
        if (espacios.length > 0 && !this.espacioId) {
          this.espacioId = espacios[0].id;
        }
      },
      error: () => showError(this.messageService, 'Error', 'No se pudieron cargar los espacios')
    });
  }

  private loadEspacioNombre(espacioId: string): void {
    this.espacioService.getById(espacioId).subscribe({
      next: (espacio) => {
        this.espacioNombre.set(espacio.nombre);
        this.buildBreadcrumb();
      }
    });
  }

  private buildBreadcrumb(): void {
    const items: MenuItem[] = [];

    if (this.espacioId && this.espacioNombre()) {
      items.push({
        label: this.espacioNombre(),
        routerLink: ['/docs'],
        queryParams: { espacioId: this.espacioId }
      });
    }

    if (this.titulo) {
      items.push({ label: this.titulo });
    }

    this.breadcrumbItems.set(items);
  }

  createSpace(): void {
    if (!this.newSpaceName.trim()) return;

    this.creatingSpace.set(true);

    this.espacioService.create({
      nombre: this.newSpaceName,
      descripcion: null
    }).subscribe({
      next: (newEspacio) => {
        this.newSpaceName = '';
        this.showNewSpace.set(false);
        this.creatingSpace.set(false);
        this.loadSpaces();
        this.espacioId = newEspacio.id;
      },
      error: () => {
        this.creatingSpace.set(false);
        showError(this.messageService, 'Error', 'No se pudo crear el espacio');
      }
    });
  }

  /** Create a space for an event (when no proyecto/espacio is selected) */
  private createEventSpace(eventoNombre: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.espacioService.create({
        nombre: eventoNombre,
        descripcion: `Espacio automático para evento: ${eventoNombre}`,
        parentId: null
      }).subscribe({
        next: (newEspacio) => {
          this.loadSpaces();
          this.espacioId = newEspacio.id;
          resolve(newEspacio.id);
        },
        error: (err) => {
          showError(this.messageService, 'Error', 'No se pudo crear espacio del evento');
          reject(err);
        }
      });
    });
  }

  onContentChange(content: string): void {
    this.contenido.set(content);
    this.parseLinks(content);
    // Trigger auto-save debounce
    this.autoSaveSubject.next();
  }

  parseLinks(content: string): void {
    const eventoMatches = content.match(/@evento:\d+/g) || [];
    const usuarioMatches = content.match(/@usuario:\w+/g) || [];
    this.detectedLinks.set([...eventoMatches, ...usuarioMatches]);
  }

  async save(): Promise<void> {
    if (!this.titulo.trim()) return;

    // For new docs without espacioId, create an event space automatically
    let espacioId = this.espacioId;
    if (!this.docId && !espacioId) {
      try {
        espacioId = await this.createEventSpace(this.titulo || 'Evento sin título');
      } catch {
        return; // Error already set in createEventSpace
      }
    }

    const contenido = this.contenido();
    const observable = this.docId
      ? this.docService.update(this.docId, { titulo: this.titulo, content: contenido })
      : this.docService.create({ titulo: this.titulo, content: contenido, espacioId: espacioId || 'default' });

    observable.subscribe({
      next: (result) => {
        // Brief "saved" indicator, then hide
        this.toolbarService.setSaveStatus('saved');
        setTimeout(() => this.toolbarService.setSaveStatus('idle'), 3000);
        // If new doc, update docId and navigate
        if (!this.docId && result?.id) {
          this.docId = result.id;
          // Track the new doc so the metadata dialog has something to show
          // (it'll be empty until an evento links to it).
          this.currentDoc.set({ id: result.id, metadata: result.metadata });
          this.router.navigate(['/docs', this.docId]);
        } else if (result?.id) {
          // Existing doc — refresh metadata so any server-side update is
          // reflected the next time the user opens the dialog.
          this.currentDoc.set({ id: result.id, metadata: result.metadata });
        }
        // Notify sidebar to refresh
        this.docService.notifyChanges();
      },
      error: (err) => {
        this.toolbarService.setSaveStatus('idle');
        const msg = err?.error?.message || err?.message || JSON.stringify(err);
        showError(this.messageService, 'Error al guardar', msg);
      }
    });
  }

  /** Auto-save without navigation — invisible to user, just brief saved check */
  private autoSave(): void {
    if (!this.titulo.trim()) return;

    // Don't auto-save new docs without espacioId — require manual save to create space
    if (!this.docId && !this.espacioId) return;

    const contenido = this.contenido();
    const observable = this.docId
      ? this.docService.update(this.docId, { titulo: this.titulo, content: contenido }, { silent: true })
      : this.docService.create({ titulo: this.titulo, content: contenido, espacioId: this.espacioId }, { silent: true });

    observable.subscribe({
      next: (result) => {
        // If new doc, update docId for future auto-saves
        if (!this.docId && result?.id) {
          this.docId = result.id;
        }
        // Brief "saved" indicator, then hide
        this.toolbarService.setSaveStatus('saved');
        setTimeout(() => this.toolbarService.setSaveStatus('idle'), 3000);
        // Notify sidebar to refresh
        this.docService.notifyChanges();
      },
      error: () => {
        // Silent fail for auto-save — no user notification
      }
    });
  }

  /** Open the .docx import dialog (triggered from the toolbar) */
  openImportDialog(): void {
    this.showImportDialog.set(true);
  }

  /**
   * Open the metadata dialog (triggered from the toolbar).
   *
   * Guard: we only open when a doc is currently loaded. In "new doc" mode
   * there's no metadata to show — opening would just flash 9 em-dash rows,
   * which is information the user already has (no doc loaded yet).
   * The toolbar's disabled state covers the "no editor" case.
   */
  openMetadataDialog(): void {
    if (this.currentDoc() === null) return;
    this.showMetadataDialog.set(true);
  }

  /**
   * Export the current editor content as .docx. The backend applies the
   * hardcoded "GEM Default" template (cover + header + footer). The
   * `contenido` signal is always in sync with the editor's last onUpdate,
   * so we can read from it directly without ViewChild-ing the editor.
   */
  async exportDocx(): Promise<void> {
    const title = this.titulo.trim() || 'documento';
    const markdown = this.contenido();
    if (!markdown.trim()) {
      showInfo(this.messageService, 'Documento vacío', 'No hay contenido para exportar.');
      return;
    }
    try {
      showInfo(this.messageService, 'Exportando', 'Generando .docx...');
      await this.exportService.exportDocx(markdown, title);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      showError(this.messageService, 'Error al exportar', msg);
    }
  }

  /**
   * Export the current editor content as .pdf (client-side, html2pdf.js).
   * Quality caveat: rasterised, fonts may not embed. For client-facing
   * deliverables, prefer the .docx and export to PDF from Word.
   */
  async exportPdf(): Promise<void> {
    const title = this.titulo.trim() || 'documento';
    const markdown = this.contenido();
    if (!markdown.trim()) {
      showInfo(this.messageService, 'Documento vacío', 'No hay contenido para exportar.');
      return;
    }
    try {
      showInfo(this.messageService, 'Exportando', 'Generando .pdf...');
      await this.exportService.exportPdf(markdown, title);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      showError(this.messageService, 'Error al exportar', msg);
    }
  }

  /**
   * Apply the imported markdown to the editor. The `contenido` signal drives
   * the editor's `initialContent` input, so setting it triggers `ngOnChanges`
   * in the editor which loads the markdown (no HTML tags detected → uses
   * tiptap-markdown's setMarkdown). The editor then fires `contentChange`
   * which flows through `onContentChange` and triggers autosave normally.
   *
   * Mode 'replace' (default): replaces the current editor content.
   * Mode 'append': appends the imported markdown at the end of current content,
   *                separated by a horizontal rule so the boundary is visible.
   */
  onImportConfirm(payload: { markdown: string; suggestedTitle: string; mode: 'replace' | 'append' }): void {
    this.showImportDialog.set(false);

    // Title replacement — only when the doc has no title yet, OR when replacing.
    // In append mode, we don't touch the title to preserve the current doc identity.
    if (payload.mode === 'replace' || !this.titulo.trim()) {
      this.titulo = payload.suggestedTitle;
      if (this.titleEl?.nativeElement) {
        this.titleEl.nativeElement.innerText = payload.suggestedTitle;
      }
      this.buildBreadcrumb();
    }

    // Content
    if (payload.mode === 'append') {
      // Append with a visible separator; if there's no existing content,
      // just use the imported markdown directly.
      const current = this.contenido();
      const separator = current.trim().length > 0 ? '\n\n---\n\n' : '';
      this.contenido.set(current + separator + payload.markdown);
    } else {
      this.contenido.set(payload.markdown);
    }
  }
}