import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { DocService } from '@core/services/doc.service';
import { EspacioService } from '@core/services/espacio.service';
import { Doc } from '@core/interfaces/doc';
import { Espacio } from '@core/interfaces/espacio';
import { SidebarSpace, SidebarDocItem } from '@core/interfaces/sidebar-tree';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-doc-sidebar',
  imports: [CommonModule, RouterLink, NgIcon],
  template: `
    <div class="doc-sidebar">
      <!-- Header -->
      <div class="sidebar-header">
        <div class="d-flex align-items-center gap-2">
          <div class="logo-icon">
            <ng-icon name="tabler-folder-open" size="13" />
          </div>
          <span class="sidebar-title">GEM Docs</span>
        </div>
        <button class="btn-new" title="Nuevo documento" (click)="goNew()">
          <ng-icon name="tabler-plus" size="14" />
        </button>
      </div>

      <!-- Tree -->
      <div class="sidebar-tree">
        @if (loading()) {
          <div class="sidebar-loading">
            <div class="spinner-border spinner-border-sm text-muted" role="status"></div>
          </div>
        } @else {
          @for (space of spaces(); track space.id) {
            <div class="space-group">
              <!-- Space header (always visible, click to toggle) -->
              <button 
                class="space-header"
                (click)="toggleSpace(space)"
                [class.expanded]="space.expanded">
                <span class="space-icon">
                  <ng-icon [name]="space.expanded ? 'tabler-folder-open' : 'tabler-folder'" size="14" />
                </span>
                <span class="space-name">{{ space.nombre }}</span>
                <span class="space-toggle">
                  <ng-icon name="tabler-chevron-down" size="12" />
                </span>
              </button>

              <!-- Doc children -->
              @if (space.expanded && space.docs.length > 0) {
                <div class="space-docs">
                  @for (doc of space.docs; track doc.id) {
                    <a 
                      [routerLink]="['/docs', doc.id]"
                      class="doc-item"
                      [class.active]="isActive(doc.id)"
                      (click)="selectDoc(doc.id)">
                      <span class="doc-icon">
                        <ng-icon name="tabler-file-text" size="14" />
                      </span>
                      <span class="doc-title">{{ doc.titulo }}</span>
                    </a>
                  }
                </div>
              }
            </div>
          }

          @if (spaces().length === 0) {
            <div class="sidebar-empty">
              <p>No hay páginas aún</p>
              <button class="btn btn-sm btn-primary" (click)="goNew()">
                Crear primera página
              </button>
            </div>
          }
        }
      </div>

      <!-- Footer -->
      <div class="sidebar-footer">
        <button class="new-page-btn" (click)="goNew()">
          <ng-icon name="tabler-plus" size="13" />
          <span>Nueva página</span>
        </button>
      </div>
    </div>
  `,
  styles: `
    .doc-sidebar {
      display: flex;
      flex-direction: column;
      height: 100%;
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

    .space-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.375rem 1rem;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--ins-body-color);
      font-size: 0.875rem;
      font-weight: 500;
      text-align: left;
      transition: background 0.15s;

      &:hover {
        background: var(--ins-tertiary-bg);
      }

      .space-toggle {
        margin-left: auto;
        transition: transform 0.2s;
        color: var(--ins-tertiary-color);
      }

      &.expanded .space-toggle {
        transform: rotate(180deg);
      }
    }

    .space-icon {
      color: var(--ins-tertiary-color);
      flex-shrink: 0;
      display: flex;
    }

    .space-name {
      flex: 1;
    }

    .space-docs {
      padding-left: 1rem;
      margin-left: 0.75rem;
      border-left: 1px solid var(--ins-border-color);
      padding-bottom: 0.25rem;
    }

    .doc-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.75rem;
      color: var(--ins-tertiary-color);
      font-size: 0.875rem;
      text-decoration: none;
      border-radius: 6px;
      margin: 0.125rem 0.25rem;
      transition: all 0.15s;

      &:hover {
        color: var(--ins-body-color);
        background: var(--ins-tertiary-bg);
      }

      &.active {
        color: var(--ins-primary-bg);
        background: var(--ins-primary-bg-subtle);
        font-weight: 500;
      }
    }

    .doc-icon {
      flex-shrink: 0;
      display: flex;
    }

    .doc-title {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .sidebar-empty {
      text-align: center;
      padding: 2rem 1rem;
      color: var(--ins-tertiary-color);
      font-size: 0.875rem;
    }

    .sidebar-footer {
      padding: 0.75rem 1rem;
      border-top: 1px solid var(--ins-border-color);
    }

    .new-page-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.5rem 0.75rem;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--ins-tertiary-color);
      font-size: 0.875rem;
      border-radius: 6px;
      transition: all 0.15s;

      &:hover {
        color: var(--ins-body-color);
        background: var(--ins-tertiary-bg);
      }
    }
  `,
})
export class DocSidebarComponent implements OnInit, OnDestroy {
  private docService = inject(DocService);
  private espacioService = inject(EspacioService);
  private router = inject(Router);

  spaces = signal<SidebarSpace[]>([]);
  loading = signal(true);
  activeDocId = signal<string | null>(null);

  private routeSub?: Subscription;

  ngOnInit(): void {
    this.loadTree();

    // Subscribe to route changes to refresh sidebar and update active doc
    this.routeSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
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

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  loadTree(): void {
    this.loading.set(true);

    // Load all docs and spaces in parallel
    this.docService.list().subscribe({
      next: (docs) => {
        this.espacioService.list().subscribe({
          next: (espacios) => {
            const tree: SidebarSpace[] = espacios.map(espacio => ({
              id: espacio.id,
              nombre: espacio.nombre,
              expanded: true,
              docs: docs
                .filter(d => d.espacioId === espacio.id)
                .map(d => ({ id: d.id, titulo: d.titulo, espacioId: d.espacioId }))
            }));
            this.spaces.set(tree);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      },
      error: () => this.loading.set(false),
    });
  }

  toggleSpace(space: SidebarSpace): void {
    this.spaces.update(spaces =>
      spaces.map(s => s.id === space.id ? { ...s, expanded: !s.expanded } : s)
    );
  }

  isActive(docId: string): boolean {
    return this.activeDocId() === docId;
  }

  selectDoc(docId: string): void {
    this.activeDocId.set(docId);
  }

  goNew(): void {
    this.router.navigate(['/docs/new']);
  }
}