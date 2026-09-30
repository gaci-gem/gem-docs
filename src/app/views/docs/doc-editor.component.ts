import { Component, ChangeDetectionStrategy, inject, signal, DestroyRef, ViewChild, ElementRef, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { DocService } from '@core/services/doc.service';
import { EspacioService } from '@core/services/espacio.service';
import { AuthService } from '@core/services/auth';
import { UserStorageService } from '@core/services/user-storage';
import { DocExportService } from '@core/services/doc-export.service';
import { VaultService } from '@core/services/vault.service';
import { SaveStatus, ToolbarService } from '../../components/toolbar/toolbar.service';
import { MilkdownEditorComponent } from '../../components/milkdown-editor/milkdown-editor.component';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { ImportDocDialogComponent } from './components/import-doc-dialog/import-doc-dialog.component';
import { MetadataDialogComponent } from './components/metadata-dialog/metadata-dialog.component';
import { PropertiesPanelComponent } from './components/properties-panel/properties-panel.component';
import { ImageLightboxComponent } from '../../components/image-lightbox/image-lightbox.component';
import { Espacio } from '@core/interfaces/espacio';
import { DocMetadata } from '@core/interfaces/doc-metadata';
import { ReferenceDrawerService, ReferenceTarget } from '@core/services/reference-drawer.service';
import { forkJoin } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { ImageUploadService } from '@core/services/image-upload.service';

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

const NEW_DOCUMENT_CONTENT = `---
tipo: pagina
estado: DRAFT
---

`;
import { MenuItem } from 'primeng/api';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, debounceTime, Subject } from 'rxjs';
import { showError, showInfo } from '../../utils/message-utils';

@Component({
  selector: 'app-doc-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MilkdownEditorComponent, ToolbarComponent, ImportDocDialogComponent, MetadataDialogComponent, PropertiesPanelComponent, ImageLightboxComponent, RouterLink, BreadcrumbModule],
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
        (viewMetadata)="openPropertiesPanel()"
         (toggleProperties)="togglePropertiesPanel()"
         (viewModeChange)="setViewMode($event)"
         [viewMode]="viewMode()"
        [propertiesVisible]="showPropertiesPanel()"
      />

      <div class="editor-layout">
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
            <app-milkdown-editor
             [initialContent]="contenido()"
             [documentId]="docId"
             (contentChange)="onContentChange($event)"
              (referenceOpen)="openReference($event)"
              (blurEvent)="onEditorBlur()"
              [viewMode]="viewMode()"
              (mermaidRenderStatus)="onMermaidRenderStatus($event)"
            />
          </div>
        </div>
        @if (showPropertiesPanel()) {
          <app-properties-panel
             [markdown]="contenido()"
             [documents]="propertyDocuments()"
             [spaceId]="espacioId"
            (markdownChange)="onContentChange($event)"
            (close)="showPropertiesPanel.set(false)"
          />
        }
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
  private imageUpload = inject(ImageUploadService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private docService = inject(DocService);
  private espacioService = inject(EspacioService);
  private authService = inject(AuthService);
  private userStorage = inject(UserStorageService);
  private toolbarService = inject(ToolbarService);
  private vaultService = inject(VaultService);
  private messageService = inject(MessageService);
  private exportService = inject(DocExportService);
  private destroyRef = inject(DestroyRef);
  private referenceDrawer = inject(ReferenceDrawerService);

  @ViewChild('titleEl', { static: true }) titleEl!: ElementRef<HTMLElement>;
  @ViewChild(MilkdownEditorComponent) private milkdownEditor?: MilkdownEditorComponent;

  docId: string | null = null;
  titulo = '';
  espacioId = '';
  contenido = signal(NEW_DOCUMENT_CONTENT);
  saving = signal(false);
  creatingSpace = signal(false);
  espacios = signal<Espacio[]>([]);
  detectedLinks = signal<string[]>([]);
  showNewSpace = signal(false);
  showImportDialog = signal(false);
  showMetadataDialog = signal(false);
  showPropertiesPanel = signal(true);
  viewMode = signal<'code' | 'graph' | 'both'>('graph');
  /** Loaded doc payload (null while loading or when creating a new doc). */
  currentDoc = signal<{ id: string; metadata: DocMetadata } | null>(null);
  propertyDocuments = signal<{ content: string }[]>([]);
  /** Convenience computed — feeds the metadata dialog input. */
  currentMetadata = computed(() => this.currentDoc()?.metadata ?? EMPTY_METADATA);
  newSpaceName = '';
  autor = toSignal(this.authService.currentUser$, { initialValue: null });
  espacioNombre = signal('');
  breadcrumbItems = signal<MenuItem[]>([]);
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/home' };

  setViewMode(mode: 'code' | 'graph' | 'both'): void { this.viewMode.set(mode); }

  onEditorBlur(): void {
    // Both is an intentional persistent preference; leaving the editor should
    // only collapse a plain Code view into the default Graph view.
    if (this.viewMode() === 'code') this.viewMode.set('graph');
  }

  onMermaidRenderStatus(success: boolean): void {
    if (!success && this.viewMode() === 'graph') this.viewMode.set('code');
  }

  openReference(target: Exclude<ReferenceTarget, null>): void {
    if (target.type === 'user') this.referenceDrawer.openUser(target.id);
    else this.referenceDrawer.openEvent(target.id);
  }

  private autoSaveSubject = new Subject<void>();
  private saveInFlight = false;
  private pendingAutoSave = false;
  private pendingManualSave = false;
  private savedSnapshot = { titulo: '', contenido: '' };
  private savedStatusTimeout?: ReturnType<typeof setTimeout>;

  constructor() {
    document.body.classList.add('editing-doc');
    this.vaultService.initialize().subscribe(() => this.loadSpaces());
    this.loadPropertyDocuments();

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
            this.contenido.set(NEW_DOCUMENT_CONTENT);
          this.savedSnapshot = { titulo: '', contenido: '' };
          this.setSaveStatus('idle');
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
    this.buildBreadcrumb();
    this.markDirty();
    this.autoSaveSubject.next();
  }

  private loadDoc(id: string): void {
    this.docService.getById(id, this.vaultService.active()?.id).subscribe({
      next: (doc) => {
        this.titulo = doc.titulo;
        this.titleEl.nativeElement.innerText = doc.titulo;
        this.contenido.set(doc.content);
        this.espacioId = doc.espacioId ?? '';
        // Store the loaded doc so the metadata dialog can read its payload
        // without re-hitting the backend. Updates here cover the caso of a
        // brand-new doc just created via POST. metadata is required on Doc
        // (spec R15); backend always returns it (default `{}`), so we trust
        // the payload directly.
        this.currentDoc.set({ id: doc.id, metadata: doc.metadata });
        if (doc.espacioId) this.loadEspacioNombre(doc.espacioId);
        this.parseLinks(doc.content);
        this.savedSnapshot = { titulo: doc.titulo, contenido: doc.content };
        this.setSaveStatus('idle');
      },
      error: () => showError(this.messageService, 'Error', 'No se pudo cargar el documento')
    });
  }

  loadSpaces(): void {
    this.espacioService.list({ vaultId: this.vaultService.active()?.id }).subscribe({
      next: (espacios) => {
        this.espacios.set(espacios);
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
    }, this.vaultService.active()?.id).subscribe({
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
      }, this.vaultService.active()?.id).subscribe({
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
    this.markDirty();
    this.autoSaveSubject.next();
  }

  parseLinks(content: string): void {
    const references = content.match(/@(?:evento|usuario):[\w-]+|\[\[[^\]\n]+\]\]/g) || [];
    this.detectedLinks.set(references);
  }

  async save(): Promise<void> {
    if (!this.titulo.trim()) return;

    if (this.saveInFlight) {
      this.pendingManualSave = true;
      return;
    }

    this.startSave(true, this.espacioId || null);
  }

  private startSave(manual: boolean, espacioId: string | null = this.espacioId || null): void {
    if (this.saveInFlight) {
      if (manual) this.pendingManualSave = true;
      else this.pendingAutoSave = true;
      return;
    }

    const titulo = this.titulo;
    const contenido = this.contenido();
    const docId = this.docId;
    this.saveInFlight = true;
    this.saving.set(true);
    this.setSaveStatus('saving');
    const observable = docId
      ? this.docService.update(docId, { titulo, content: contenido }, { ...(manual ? {} : { silent: true }), vaultId: this.vaultService.active()?.id })
      : this.docService.create(
        { titulo, content: contenido, espacioId: espacioId || null },
        { ...(manual ? {} : { silent: true }), vaultId: this.vaultService.active()?.id },
      );

    observable.subscribe({
      next: (result) => {
        const created = !docId && !!result?.id;
        if (created) {
          this.docId = result.id;
          // Track the new doc so the metadata dialog has something to show
          // (it'll be empty until an evento links to it).
          this.currentDoc.set({ id: result.id, metadata: result.metadata });
          if (manual) this.router.navigate(['/docs', this.docId]);
        } else if (result?.id) {
          // Existing doc — refresh metadata so any server-side update is
          // reflected the next time the user opens the dialog.
          this.currentDoc.set({ id: result.id, metadata: result.metadata });
        }
        this.savedSnapshot = { titulo, contenido };
        this.saveInFlight = false;
        this.saving.set(false);
        this.setSaveStatus('saved');
        this.docService.notifyChanges();
        this.processPendingSave();
      },
      error: (err) => {
        this.saveInFlight = false;
        this.saving.set(false);
        this.setSaveStatus('error');
        const msg = err?.error?.message || err?.message || JSON.stringify(err);
        showError(this.messageService, 'Error al guardar', msg);
        const manual = this.pendingManualSave;
        this.pendingManualSave = false;
        this.pendingAutoSave = false;
        if (manual) this.startSave(true);
      }
    });
  }

  /** Auto-save without navigation — invisible to user, just brief saved check */
  private autoSave(): void {
    if (!this.titulo.trim()) return;

    // Don't auto-save new docs without espacioId — require manual save to create space
    if (!this.docId && !this.espacioId) return;

    this.startSave(false, this.espacioId);
  }

  private markDirty(): void {
    if (this.titulo !== this.savedSnapshot.titulo || this.contenido() !== this.savedSnapshot.contenido) {
      this.setSaveStatus('dirty');
    }
  }

  private setSaveStatus(status: SaveStatus): void {
    if (this.savedStatusTimeout) clearTimeout(this.savedStatusTimeout);
    this.toolbarService.setSaveStatus(status);
    if (status === 'saved') {
      this.savedStatusTimeout = setTimeout(() => {
        if (!this.saveInFlight && this.titulo === this.savedSnapshot.titulo && this.contenido() === this.savedSnapshot.contenido) {
          this.toolbarService.setSaveStatus('idle');
        }
      }, 3000);
    }
  }

  private processPendingSave(): void {
    const manual = this.pendingManualSave;
    const auto = this.pendingAutoSave;
    this.pendingManualSave = false;
    this.pendingAutoSave = false;
    if (manual || (auto && (this.titulo !== this.savedSnapshot.titulo || this.contenido() !== this.savedSnapshot.contenido))) {
      this.startSave(manual);
    }
  }

  /** Open the .docx import dialog (triggered from the toolbar) */
  openImportDialog(): void {
    this.showImportDialog.set(true);
  }

  /** Open the editable properties panel (triggered from the toolbar). */
  openMetadataDialog(): void {
    this.openPropertiesPanel();
  }

  private loadPropertyDocuments(): void {
    // Keep lightweight test doubles and embedded callers compatible while the
    // editor enriches the existing document list with content for suggestions.
    if (typeof this.docService.list !== 'function') return;
    this.docService.list({ silent: true }).subscribe({
      next: (docs) => forkJoin(docs.map((doc) => this.docService.getById(doc.id))).subscribe({
        next: (documents) => this.propertyDocuments.set(documents),
      }),
    });
  }

  openPropertiesPanel(): void {
    if (this.currentDoc() !== null || this.contenido().trim()) this.showPropertiesPanel.set(true);
  }

  togglePropertiesPanel(): void {
    this.showPropertiesPanel.update((visible) => !visible);
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
      const references = await this.milkdownEditor?.getExportReferenceCatalog() ?? [];
      await this.exportService.exportDocx(markdown, title, this.docId, references);
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
      const references = await this.milkdownEditor?.getExportReferenceCatalog() ?? [];
      await this.exportService.exportPdf(markdown, title, this.docId, references);
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
  async onImportConfirm(payload: { markdown: string; suggestedTitle: string; mode: 'replace' | 'append'; imagesBase64: string[] }): Promise<void> {
    this.showImportDialog.set(false);

    // Title replacement — only when the doc has no title yet, OR when replacing.
    // In append mode, we don't touch the title to preserve the current doc identity.
    if (payload.mode === 'replace' || !this.titulo.trim()) {
      this.titulo = payload.suggestedTitle;
      if (this.titleEl?.nativeElement) {
        this.titleEl.nativeElement.innerText = payload.suggestedTitle;
      }
      this.buildBreadcrumb();
      this.markDirty();
    }

    // Content. Keep imported data URIs private to the import transaction; the
    // document must exist before uploads can be assigned to its assets folder.
    let importedContent: string;
    if (payload.mode === 'append') {
      // Append with a visible separator; if there's no existing content,
      // just use the imported markdown directly.
      const current = this.contenido();
      const separator = current.trim().length > 0 ? '\n\n---\n\n' : '';
      importedContent = current + separator + payload.markdown;
    } else {
      importedContent = payload.markdown;
    }
    try {
      const docId = await this.ensureDocumentForImport(importedContent);
      let finalContent = importedContent;
      for (let i = 0; i < payload.imagesBase64.length; i++) {
        const dataUri = payload.imagesBase64[i];
        const upload = await firstValueFrom(this.imageUpload.uploadBase64(dataUri, `imported-${i}`, docId));
        finalContent = finalContent.split(dataUri).join(upload.url);
      }
      this.onContentChange(finalContent);
      await firstValueFrom(this.docService.update(docId, { titulo: this.titulo, content: finalContent }, { vaultId: this.vaultService.active()?.id }));
      this.savedSnapshot = { titulo: this.titulo, contenido: finalContent };
      this.docService.notifyChanges();
    } catch (err) {
      const failure = err as { error?: { message?: string }; message?: string };
      showError(this.messageService, 'Error al importar', failure.error?.message || failure.message || 'No se pudo guardar la importación');
    }
  }

  private async ensureDocumentForImport(content: string): Promise<string> {
    if (this.docId) return this.docId;
    const created = await firstValueFrom(this.docService.create(
      { titulo: this.titulo, content, espacioId: this.espacioId || null },
      { vaultId: this.vaultService.active()?.id },
    ));
    this.docId = created.id;
    this.currentDoc.set({ id: created.id, metadata: created.metadata });
    await this.router.navigate(['/docs', created.id]);
    return created.id;
  }
}
