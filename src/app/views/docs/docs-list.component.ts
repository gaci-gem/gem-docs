import { Component, inject, signal, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem, ConfirmationService, MessageService } from 'primeng/api';
import { NgIcon } from '@ng-icons/core';
import { DocService } from '@core/services/doc.service';
import { EspacioService } from '@core/services/espacio.service';
import { Doc } from '@core/interfaces/doc';
import { Espacio } from '@core/interfaces/espacio';
import { showError, showSuccess } from '../../utils/message-utils';

/**
 * Docs listing page. Two modes:
 *  - No `espacio` query param → all docs in the system (root-level view).
 *  - With `espacio` query param → inside a space: shows sub-spaces grid,
 *    docs grid, breadcrumb, and actions to create either.
 *
 * Sub-spaces are nested infinitely (the backend enforces no limit, only the
 * DB schema does). Each level of nesting shows the same UI recursively.
 *
 * Naming note: the canonical query param is `?espacioId=<id>` (matches the
 * `Doc.espacioId` property name). The shorter alias `?espacio=<id>` is also
 * accepted for backwards compatibility with old bookmarks.
 */
@Component({
  selector: 'app-docs-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink, ConfirmDialogModule, ToastModule, BreadcrumbModule, NgIcon],
  styleUrl: './docs-list.component.scss',
  template: `
    <p-toast />
    <p-confirmDialog />
    <div class="docs-list-page">
      <!-- Top toolbar: Breadcrumb (left) + Action buttons (right) -->
      <div class="docs-toolbar d-flex justify-content-between align-items-center px-3 py-2 mb-4">
        <p-breadcrumb [model]="breadcrumbItems()" [home]="breadcrumbHome" />
        <div class="d-flex gap-2">
          @if (espacioId()) {
            <button class="btn btn-sm btn-ghost-secondary text-primary fw-medium" (click)="newSubEspacioOpen.set(!newSubEspacioOpen())">
              <ng-icon name="tabler-plus" size="14" class="me-1" />
              Nuevo sub-espacio
            </button>
            <a [routerLink]="['/docs/new']" [queryParams]="{ espacioId: espacioId() }" class="btn btn-sm btn-primary fw-medium">
              <ng-icon name="tabler-plus" size="14" class="me-1" />
              Nuevo documento
            </a>
          } @else {
            <a routerLink="/docs/new" class="btn btn-sm btn-primary fw-medium">
              <ng-icon name="tabler-plus" size="14" class="me-1" />
              Nuevo documento
            </a>
          }
        </div>
      </div>

      <div class="container-fluid max-width-container">
        <!-- Big title below the toolbar -->
        <h1 class="display-6 fw-bold mb-4">
          {{ espacioId() ? currentEspacio()?.nombre : 'Documentos' }}
        </h1>

        <!-- Inline form to create a sub-espacio -->
        @if (newSubEspacioOpen()) {
          <div class="card mb-4">
            <div class="card-body">
              <h6 class="card-title mb-3">Nuevo sub-espacio</h6>
              <div class="row g-3">
                <div class="col-md-6">
                  <input
                    type="text"
                    [(ngModel)]="newSubEspacioNombre"
                    placeholder="Nombre del sub-espacio"
                    class="form-control form-control-sm"
                    (keyup.enter)="createSubEspacio()"
                  />
                </div>
                <div class="col-12 d-flex gap-2">
                  <button
                    class="btn btn-sm btn-primary"
                    (click)="createSubEspacio()"
                    [disabled]="!newSubEspacioNombre.trim() || creatingSubEspacio()">
                    @if (creatingSubEspacio()) { Creando... } @else { Crear }
                  </button>
                  <button
                    class="btn btn-sm btn-ghost-secondary"
                    (click)="newSubEspacioOpen.set(false); newSubEspacioNombre = ''">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Loading state -->
        @if (loading()) {
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2 text-muted">Cargando...</p>
          </div>
        }

        <!-- Empty state (only when there's truly nothing) -->
        @if (!loading() && items().length === 0) {
          <div class="card">
            <div class="card-body text-center py-5">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-muted mb-3"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
              <p class="text-muted mb-3">
                {{ espacioId() ? 'Este espacio está vacío' : 'No hay documentos todavía' }}
              </p>
              @if (espacioId()) {
                <button class="btn btn-primary me-2" (click)="newSubEspacioOpen.set(true)">
                  Crear sub-espacio
                </button>
                <a [routerLink]="['/docs/new']" [queryParams]="{ espacioId: espacioId() }" class="btn btn-ghost-secondary">
                  Crear documento
                </a>
              } @else {
                <a routerLink="/docs/new" class="btn btn-primary">
                  Crear el primero
                </a>
              }
            </div>
          </div>
        }

        <!-- Unified table: sub-espacios + documentos mezclados -->
        @if (!loading() && items().length > 0) {
          <div class="card table-card">
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Última modificación</th>
                      <th style="width: 90px;"></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of items(); track item.id) {
                      <tr>
                        <td>
                          <div class="d-flex align-items-center gap-2">
                            @if (item.type === 'espacio') {
                              <ng-icon name="tabler-folder" size="18" class="text-primary flex-shrink-0" />
                              <a [routerLink]="['/docs']" [queryParams]="{espacioId: item.id}" class="text-decoration-none fw-medium">
                                {{ item.label }}
                              </a>
                            } @else {
                              <ng-icon name="tabler-file-text" size="18" class="text-secondary flex-shrink-0" />
                              <a [routerLink]="['/docs', item.id]" class="text-decoration-none fw-medium">
                                {{ item.label }}
                              </a>
                            }
                          </div>
                          @if (item.type === 'espacio' && item.descripcion) {
                            <small class="text-muted ms-4 ps-2">{{ item.descripcion }}</small>
                          }
                        </td>
                        <td class="text-muted">
                          @if (item.type === 'espacio') {
                            {{ item.createdAt | date:'medium' }}
                          } @else {
                            {{ item.updatedAt | date:'medium' }}
                          }
                        </td>
                        <td>
                          <div class="d-flex gap-1 justify-content-end">
                            @if (item.type === 'doc') {
                              <a
                                [routerLink]="['/docs', item.id]"
                                class="btn btn-sm btn-ghost-secondary"
                                title="Editar">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                              </a>
                            }
                            <button
                              class="btn btn-sm btn-ghost-secondary"
                              title="Eliminar"
                              (click)="item.type === 'espacio' ? deleteEspacio(item.id, item.label) : deleteDoc(item.id, item.label)">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class DocsListComponent implements OnInit {
  private docService = inject(DocService);
  private espacioService = inject(EspacioService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  docs = signal<Doc[]>([]);
  subEspacios = signal<Espacio[]>([]);
  allEspacios = signal<Espacio[]>([]);  // cache for breadcrumb walking
  currentEspacio = signal<Espacio | null>(null);
  loading = signal(true);
  espacioId = signal<string | null>(null);
  newSubEspacioOpen = signal(false);
  newSubEspacioNombre = '';
  creatingSubEspacio = signal(false);

  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/docs' };

  /**
   * Items for PrimeNG `<p-breadcrumb>`. Ordered root → current.
   * Each item carries the `queryParams` needed to navigate into that space.
   */
  breadcrumbItems = computed<MenuItem[]>(() => {
    const id = this.espacioId();
    if (!id) return [];
    const all = this.allEspacios();
    const items: MenuItem[] = [];
    let cursor: string | null | undefined = id;
    for (let i = 0; cursor && i < 16; i++) {
      const esp = all.find((e) => e.id === cursor);
      if (!esp) break;
      items.unshift({
        label: esp.nombre,
        routerLink: '/docs',
        queryParams: { espacioId: esp.id },
      });
      cursor = esp.parentId;
    }
    return items;
  });

  /**
   * Unified table rows: sub-espacios + documentos merged into one ordered
   * list. Sub-espacios sort first (alphabetical by nombre), then documentos
   * (most recently updated first). Each row carries a unified `label` field
   * so the template doesn't need to discriminate on type for the title.
   */
  items = computed<ListItem[]>(() => {
    const espacios: ListItem[] = this.subEspacios().map((e) => ({
      type: 'espacio',
      id: e.id,
      label: e.nombre,
      descripcion: e.descripcion,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    }));
    const docs: ListItem[] = this.docs().map((d) => ({
      type: 'doc',
      id: d.id,
      label: d.titulo,
      updatedAt: d.updatedAt,
      createdAt: d.createdAt,
    }));
    const espSorted = [...espacios].sort((a, b) => a.label.localeCompare(b.label, 'es'));
    const docSorted = [...docs].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
    return [...espSorted, ...docSorted];
  });

  ngOnInit(): void {
    // React to query param changes (so navigation into a sub-space reloads
    // the data instead of stale state from the previous space).
    //
    // Accept both `espacioId` (canonical, matches the Doc.espacioId property)
    // and `espacio` (legacy alias, used by EspaciosComponent and some
    // bookmarks). `espacioId` wins if both are present.
    this.route.queryParamMap.subscribe((params) => {
      const id = params.get('espacioId') ?? params.get('espacio');
      this.espacioId.set(id);
      this.load();
    });
  }

  private load(): void {
    this.loading.set(true);
    this.subEspacios.set([]);
    this.docs.set([]);
    this.currentEspacio.set(null);
    this.newSubEspacioOpen.set(false);
    this.newSubEspacioNombre = '';

    const id = this.espacioId();

    if (id) {
      // Inside a space: load the space (with children), the docs in it, and
      // the full espacios list (used for breadcrumb walking).
      this.espacioService.getById(id).subscribe({
        next: (esp) => {
          this.currentEspacio.set(esp);
          this.subEspacios.set(esp.children ?? []);
          this.refreshAllEspaciosCache();
          this.loading.set(false);
        },
        error: () => {
          showError(this.messageService, 'Error', 'No se pudo cargar el espacio');
          this.loading.set(false);
        },
      });
      this.docService.getByEspacio(id).subscribe({
        next: (docs) => { this.docs.set(docs); },
        error: () => showError(this.messageService, 'Error', 'No se pudieron cargar los documentos'),
      });
    } else {
      // Root listing: show all docs.
      this.docService.list().subscribe({
        next: (docs) => { this.docs.set(docs); this.loading.set(false); },
        error: () => { this.loading.set(false); showError(this.messageService, 'Error', 'No se pudieron cargar los documentos'); },
      });
    }
  }

  private refreshAllEspaciosCache(): void {
    this.espacioService.list({ silent: true }).subscribe({
      next: (espacios) => this.allEspacios.set(espacios),
    });
  }

  createSubEspacio(): void {
    const nombre = this.newSubEspacioNombre.trim();
    const parentId = this.espacioId();
    if (!nombre || !parentId) return;

    this.creatingSubEspacio.set(true);
    this.espacioService.create({ nombre, parentId, descripcion: null }).subscribe({
      next: (created) => {
        this.creatingSubEspacio.set(false);
        this.newSubEspacioNombre = '';
        this.newSubEspacioOpen.set(false);
        // Append the new sub-space and refresh the breadcrumb cache.
        this.subEspacios.update((list) => [created, ...list]);
        this.refreshAllEspaciosCache();
        showSuccess(this.messageService, 'Creado', `Sub-espacio "${nombre}" creado`);
      },
      error: () => {
        this.creatingSubEspacio.set(false);
        showError(this.messageService, 'Error', 'No se pudo crear el sub-espacio');
      },
    });
  }

  deleteDoc(docId: string, titulo: string): void {
    this.confirmationService.confirm({
      message: `Eliminar "${titulo}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.docService.delete(docId).subscribe({
          next: () => {
            this.docs.update((list) => list.filter((d) => d.id !== docId));
            showSuccess(this.messageService, 'Eliminado', 'Documento eliminado');
          },
          error: () => showError(this.messageService, 'Error', 'No se pudo eliminar'),
        });
      },
    });
  }

  /**
   * Delete a sub-espacio (recursive on the backend: also removes any nested
   * sub-spaces and the docs inside them).
   */
  deleteEspacio(espacioId: string, nombre: string): void {
    this.confirmationService.confirm({
      message: `Eliminar el espacio "${nombre}"? Esto también borra todos los sub-espacios y documentos que contiene.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.espacioService.delete(espacioId).subscribe({
          next: () => {
            this.subEspacios.update((list) => list.filter((e) => e.id !== espacioId));
            this.refreshAllEspaciosCache();
            showSuccess(this.messageService, 'Eliminado', `Espacio "${nombre}" eliminado`);
          },
          error: () => showError(this.messageService, 'Error', 'No se pudo eliminar el espacio'),
        });
      },
    });
  }
}

/**
 * Discriminated union for the unified table. Each variant shares the
 * `label` field so the template can render the row title without
 * narrowing — discrimination is only needed for the row icon, link,
 * and delete handler.
 */
type ListItem =
  | {
      type: 'espacio';
      id: string;
      label: string;
      descripcion: string | null;
      createdAt: Date;
      updatedAt: Date;
    }
  | {
      type: 'doc';
      id: string;
      createdAt: Date;
      updatedAt: Date;
      label: string;
    };
