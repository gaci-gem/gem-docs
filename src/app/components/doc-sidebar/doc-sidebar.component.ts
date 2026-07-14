import { Component, ChangeDetectionStrategy, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';
import { MessageService } from 'primeng/api';
import { DocService } from '@core/services/doc.service';
import { EspacioService } from '@core/services/espacio.service';
import { Doc } from '@core/interfaces/doc';
import { Espacio } from '@core/interfaces/espacio';
import { SidebarSpace, SidebarDocItem } from '@core/interfaces/sidebar-tree';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-doc-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, NgIcon, FormsModule, DialogModule, InputTextModule, ButtonModule, ConfirmDialogModule, ToastModule, TooltipModule],
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
  template: `
    <p-toast />
    <p-confirmDialog />
    <div class="doc-sidebar">
      <!-- Header -->
      <div class="sidebar-header">
        <div class="d-flex align-items-center gap-2">
          <div class="logo-icon">
            <ng-icon name="tabler-folder-open" size="13" />
          </div>
          <span class="sidebar-title">GEM Docs</span>
        </div>
        <div class="header-actions">
          <button class="btn-new" title="Nuevo espacio" (click)="openCreateDialog(null)">
            <ng-icon name="tabler-plus" size="14" />
          </button>
        </div>
      </div>

      <!-- Tree -->
      <div class="sidebar-tree">
        @if (loading()) {
          <div class="sidebar-loading">
            <div class="spinner-border spinner-border-sm text-muted" role="status"></div>
          </div>
        } @else {
          @for (entry of getFlattenedSpaces(); track entry.space.id) {
            <div class="space-group" [style.padding-left.px]="entry.depth * 16">
              <div class="space-row">
                <!-- Expand/collapse (click on name) -->
                <button
                  class="space-header"
                  (click)="toggleSpace(entry.space)"
                  [pTooltip]="entry.space.nombre"
                  tooltipPosition="right"
                  [showDelay]="300">
                  <span class="space-icon">
                    <ng-icon [name]="entry.space.expanded ? 'tabler-folder-open' : 'tabler-folder'" size="14" />
                  </span>
                  <span class="space-name">{{ entry.space.nombre }}</span>
                </button>

                <!-- 3-dot menu button -->
                @if (!editingSpaceId()) {
                  <button class="btn-menu" title="Menú" (click)="toggleMenu(entry.space.id)">
                    <ng-icon name="tabler-dots" size="14" />
                  </button>
                  @if (menuFor() === entry.space.id) {
                    <div class="menu-dropdown">
                      <button class="menu-item" (click)="openCreateDialog(entry.space.id)">Crear espacio</button>
                      <button class="menu-item" (click)="startCreatingPage(entry.space.id)">Crear página</button>
                      <button class="menu-item" (click)="startRenamingSpace(entry.space)">Renombrar</button>
                      <button class="menu-item danger" (click)="deleteSpace(entry.space.id)">Eliminar</button>
                    </div>
                  }
                }
              </div>

              <!-- Doc children -->
              @if (entry.space.expanded && entry.space.docs.length > 0) {
                <div class="space-docs">
                  @for (doc of entry.space.docs; track doc.id) {
                    <div class="doc-row">
                      <a
                        [routerLink]="['/docs', doc.id]"
                        class="doc-item"
                        [class.active]="isActive(doc.id)"
                        (click)="selectDoc(doc.id)"
                        [pTooltip]="doc.titulo"
                        tooltipPosition="right"
                        [showDelay]="300">
                        <span class="doc-icon">
                          <ng-icon name="tabler-file-text" size="14" />
                        </span>
                        <span class="doc-title">{{ doc.titulo }}</span>
                      </a>
                      <button class="btn-menu-sm" title="Menú" (click)="toggleDocMenu(doc.id)">
                        <ng-icon name="tabler-dots" size="12" />
                      </button>
                      @if (docMenuFor() === doc.id) {
                        <div class="menu-dropdown">
                          <button class="menu-item danger" (click)="deleteDoc(doc.id)">Eliminar</button>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }

          @if (spaces().length === 0) {
            <div class="sidebar-empty">
              <p>No hay espacios aún</p>
              <button class="btn btn-sm btn-primary" (click)="openCreateDialog(null)">
                Crear primer espacio
              </button>
            </div>
          }
        }
      </div>

      <!-- Footer -->
      <div class="sidebar-footer"></div>

      <!-- Create space dialog -->
      <p-dialog
        header="Nuevo espacio"
        [(visible)]="showCreateDialog"
        [modal]="true"
        [style]="{ width: '320px' }"
        [draggable]="false"
        [resizable]="false">
        <div class="create-space-form">
          <input
            #spaceNameInput
            pInputText
            [(ngModel)]="createDialogName"
            placeholder="Nombre del espacio"
            class="w-full"
            (keydown.enter)="confirmCreateSpace()"
            (keydown.escape)="closeCreateDialog()" />
        </div>
        <ng-template #footer>
          <button pButton label="Cancelar" class="p-button-text" (click)="closeCreateDialog()"></button>
          <button pButton label="Crear" class="p-button-sm" (click)="confirmCreateSpace()" [disabled]="!createDialogName.trim()"></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: `
    .doc-sidebar {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      background: var(--ins-secondary-bg);
      border-right: 1px solid var(--ins-border-color);
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--ins-border-color);
    }

    .logo-icon {
      width: 24px;
      height: 24px;
      background: var(--ins-primary-bg);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--ins-primary-bg);
      flex-shrink: 0;
    }

    .sidebar-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--ins-body-color);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      position: relative;
    }

    .btn-new {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--ins-tertiary-color);
      padding: 0.25rem;
      border-radius: 4px;
      display: flex;
      align-items: center;
      &:hover {
        background: var(--ins-tertiary-bg);
        color: var(--ins-body-color);
      }
    }

    .sidebar-tree {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem 0;
    }

    .sidebar-loading {
      display: flex;
      justify-content: center;
      padding: 2rem;
    }

    .space-group {
      margin-bottom: 0.25rem;
    }

    .space-row {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      min-width: 0;          /* allow .space-header to shrink so .space-name can ellipsis */
      padding-right: 0.25rem;
    }

    .space-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
      min-width: 0;          /* allow .space-name inside to ellipsis */
      padding: 0.375rem 0.5rem;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--ins-body-color);
      font-size: 0.875rem;
      font-weight: 500;
      text-align: left;
      border-radius: 6px;
      &:hover { background: var(--ins-tertiary-bg); }
    }

    .space-icon {
      color: var(--ins-tertiary-color);
      flex-shrink: 0;
      display: flex;
    }

    .space-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .space-name-input {
      flex: 1;
      padding: 0.2rem 0.5rem;
      border: 1px solid var(--ins-primary-bg);
      border-radius: 4px;
      font-size: 0.875rem;
      background: var(--ins-secondary-bg);
      color: var(--ins-body-color);
      outline: none;
      min-width: 0;
    }

    .space-docs {
      padding-left: 1rem;
      margin-left: 0.75rem;
      border-left: 1px solid var(--ins-border-color);
      padding-bottom: 0.25rem;
    }

    .doc-row {
      display: flex;
      align-items: center;
      position: relative;
      margin: 0.125rem 0;
      min-width: 0;
      &:hover .btn-menu-sm { opacity: 1; }
    }

    .doc-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
      min-width: 0;          /* allow shrinking so ellipsis inside .doc-title works */
      padding: 0.375rem 0.5rem;
      color: var(--ins-tertiary-color);
      font-size: 0.875rem;
      text-decoration: none;
      border-radius: 6px;
      transition: all 0.15s;
      &:hover { color: var(--ins-body-color); background: var(--ins-tertiary-bg); }
      &.active { color: var(--ins-primary-bg); background: var(--ins-primary-bg-subtle); font-weight: 500; }
    }

    .doc-icon {
      flex-shrink: 0;
      display: flex;
    }

    .doc-title {
      flex: 1;
      min-width: 0;          /* required for ellipsis to truncate */
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .btn-menu {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--ins-tertiary-color);
      padding: 0.2rem;
      border-radius: 4px;
      display: flex;
      align-items: center;
      flex-shrink: 0;
      opacity: 0;
      &:hover { background: var(--ins-tertiary-bg); color: var(--ins-body-color); }
    }

    .space-row:hover .btn-menu { opacity: 1; }

    .btn-menu-sm {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--ins-tertiary-color);
      padding: 0.15rem;
      border-radius: 4px;
      display: flex;
      align-items: center;
      flex-shrink: 0;
      opacity: 0;
      &:hover { background: var(--ins-tertiary-bg); color: var(--ins-body-color); }
    }

    .menu-dropdown {
      position: absolute;
      top: calc(100% + 2px);
      right: 0;
      z-index: 100;
      background: var(--ins-secondary-bg);
      border: 1px solid var(--ins-border-color);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      min-width: 160px;
      padding: 0.25rem 0;
    }

    .menu-item {
      display: block;
      width: 100%;
      padding: 0.5rem 0.875rem;
      background: none;
      border: none;
      cursor: pointer;
      text-align: left;
      font-size: 0.875rem;
      color: var(--ins-body-color);
      &:hover { background: var(--ins-tertiary-bg); }
      &.danger { color: #dc2626; }
      &.danger:hover { background: #fef2f2; }
    }

    .sidebar-empty {
      text-align: center;
      padding: 2rem 1rem;
      color: var(--ins-tertiary-color);
      font-size: 0.875rem;
    }

    .sidebar-footer {
      display: none;
    }
  `,
})
export class DocSidebarComponent {
  private docService = inject(DocService);
  private espacioService = inject(EspacioService);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  spaces = signal<SidebarSpace[]>([]);
  loading = signal(true);
  activeDocId = signal<string | null>(null);
  // Inline edit mode: spaceId (rename only) or null
  editingSpaceId = signal<string | null>(null);
  editingSpaceName = '';
  // Create space dialog
  showCreateDialog = signal(false);
  createDialogName = '';
  createDialogParentId: string | null = null;
  // Menu dropdowns
  menuFor = signal<string | null>(null);
  docMenuFor = signal<string | null>(null);

  constructor() {
    this.loadTree();

    // Subscribe to doc changes — refresh tree when a doc is created/updated.
    // Silent refresh: background update from autosave shouldn't trigger global spinner.
    this.docService.changes$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadTree({ silent: true });
    });

    // Subscribe to route changes to refresh sidebar and update active doc.
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((e: NavigationEnd) => {
      const url = e.urlAfterRedirects || e.url;

      // Refresh tree when navigating to docs list
      if (url === '/docs' || url.startsWith('/docs?')) {
        this.loadTree();
      }

      // Update active doc ID
      if (url.includes('/docs/') && !url.endsWith('/docs/new')) {
        const id = url.split('/docs/')[1]?.split('?')[0];
        this.activeDocId.set(id || null);
      } else if (url === '/docs' || url.endsWith('/docs/new')) {
        this.activeDocId.set(null);
      }
    });
  }

  loadTree(options?: { silent?: boolean }): void {
    // Skip local loading state for silent refresh: keeping @if (loading()) false
    // means the @for tree stays mounted in the DOM, avoiding flicker when
    // autosave triggers a background refresh.
    const showLoading = !options?.silent;
    if (showLoading) this.loading.set(true);

    // Load all docs and spaces in parallel
    this.docService.list(options).subscribe({
      next: (docs) => {
        this.espacioService.list(options).subscribe({
          next: (espacios) => {
            // Build space nodes with docs attached
            const spaceMap = new Map<string, SidebarSpace>();
            espacios.forEach(e => {
              spaceMap.set(e.id, {
                id: e.id,
                nombre: e.nombre,
                parentId: e.parentId ?? null,
                expanded: true,
                docs: docs
                  .filter(d => d.espacioId === e.id)
                  .map(d => ({ id: d.id, titulo: d.titulo, espacioId: d.espacioId })),
                children: []
              });
            });

            // Build tree: attach children to parents
            const rootSpaces: SidebarSpace[] = [];
            spaceMap.forEach(space => {
              if (space.parentId) {
                const parent = spaceMap.get(space.parentId);
                if (parent) {
                  parent.children.push(space);
                } else {
                  // Parent doesn't exist, treat as root
                  rootSpaces.push(space);
                }
              } else {
                rootSpaces.push(space);
              }
            });

            this.spaces.set(rootSpaces);
            if (showLoading) this.loading.set(false);
          },
          error: () => { if (showLoading) this.loading.set(false); },
        });
      },
      error: () => { if (showLoading) this.loading.set(false); },
    });
  }

  /** Flatten tree for rendering: each entry has depth for indentation */
  getFlattenedSpaces(): { space: SidebarSpace; depth: number }[] {
    const result: { space: SidebarSpace; depth: number }[] = [];
    const flatten = (spaces: SidebarSpace[], depth: number) => {
      spaces.forEach(s => {
        result.push({ space: s, depth });
        if (s.expanded && s.children.length > 0) {
          flatten(s.children, depth + 1);
        }
      });
    };
    flatten(this.spaces(), 0);
    return result;
  }

  toggleSpace(space: SidebarSpace): void {
    // Recursive toggle - update this space and all children
    const updateSpace = (s: SidebarSpace): SidebarSpace => {
      if (s.id === space.id) {
        return { ...s, expanded: !s.expanded };
      }
      return { ...s, children: s.children.map(c => updateSpace(c)) };
    };
    this.spaces.update(spaces => spaces.map(s => updateSpace(s)));
  }

  isActive(docId: string): boolean {
    return this.activeDocId() === docId;
  }

  selectDoc(docId: string): void {
    this.activeDocId.set(docId);
  }

  // ── Inline edit / create ──────────────────────────────────────────────

  startRenamingSpace(space: SidebarSpace): void {
    this.editingSpaceId.set(space.id);
    this.editingSpaceName = space.nombre;
    this.closeMenus();
  }

  saveInlineSpace(): void {
    const name = this.editingSpaceName.trim();
    if (!name) { this.cancelInlineEdit(); return; }
    this.espacioService.update(this.editingSpaceId()!, { nombre: name }).subscribe({
      next: () => { this.cancelInlineEdit(); this.loadTree(); },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al renombrar' })
    });
  }

  cancelInlineEdit(): void {
    this.editingSpaceId.set(null);
    this.editingSpaceName = '';
  }

  // ── Create space dialog ──────────────────────────────────────────────

  openCreateDialog(parentId: string | null): void {
    this.createDialogParentId = parentId;
    this.createDialogName = '';
    this.showCreateDialog.set(true);
    this.closeMenus();
  }

  confirmCreateSpace(): void {
    const name = this.createDialogName.trim();
    if (!name) return;
    this.espacioService.create({
      nombre: name,
      descripcion: null,
      parentId: this.createDialogParentId
    }).subscribe({
      next: () => { this.closeCreateDialog(); this.loadTree(); },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear espacio' })
    });
  }

  closeCreateDialog(): void {
    this.showCreateDialog.set(false);
    this.createDialogName = '';
    this.createDialogParentId = null;
  }

  // ── Menu control ───────────────────────────────────────────────────

  /** Bound via `host: { '(document:click)': 'onDocumentClick($event)' }` — no @HostListener decorator (AGENTS.md). */
  onDocumentClick(event: MouseEvent): void {
    // Close menus when clicking outside the sidebar menus
    const target = event.target as HTMLElement;
    if (!target.closest('.menu-dropdown') && !target.closest('.btn-menu') && !target.closest('.btn-menu-sm')) {
      this.closeMenus();
    }
  }

  toggleMenu(id: string): void {
    this.menuFor.set(this.menuFor() === id ? null : id);
  }

  toggleDocMenu(id: string): void {
    this.docMenuFor.set(this.docMenuFor() === id ? null : id);
  }

  closeMenus(): void {
    this.menuFor.set(null);
    this.docMenuFor.set(null);
  }

  // ── Actions ────────────────────────────────────────────────────────

  startCreatingPage(spaceId: string): void {
    this.closeMenus();
    this.router.navigate(['/docs/new'], { queryParams: { espacioId: spaceId } });
  }

  deleteSpace(id: string): void {
    this.confirmationService.confirm({
      message: 'Eliminar espacio y todas sus páginas?',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        // Close the dropdown immediately — don't wait for the async delete to
        // resolve, otherwise the menu stays visible during the request and
        // appears to "reopen" when loadTree() re-renders the tree below it.
        this.closeMenus();
        this.espacioService.delete(id).subscribe({
          next: () => this.loadTree(),
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar espacio' })
        });
      },
      reject: () => this.closeMenus(),
    });
  }

  deleteDoc(id: string): void {
    this.confirmationService.confirm({
      message: 'Eliminar página?',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        // Close the dropdown immediately — don't wait for the async delete to
        // resolve, otherwise the menu stays visible during the request and
        // appears to "reopen" when loadTree() re-renders the tree below it.
        this.closeMenus();
        this.docService.delete(id).subscribe({
          next: () => this.loadTree(),
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar página' })
        });
      },
      reject: () => this.closeMenus(),
    });
  }

  goNew(): void {
    this.router.navigate(['/docs/new']);
  }
}