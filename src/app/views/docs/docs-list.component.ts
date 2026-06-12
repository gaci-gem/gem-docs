import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DocService } from '@core/services/doc.service';
import { Doc } from '@core/interfaces/doc';

@Component({
  selector: 'app-docs-list',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="docs-list-page">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">Documentos</h4>
        <a routerLink="/docs/new" class="btn btn-primary">
          <i class="ti ti-plus me-1"></i>
          Nuevo documento
        </a>
      </div>

      @if (loading()) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
          <p class="mt-2 text-muted">Cargando documentos...</p>
        </div>
      } @else if (docs().length === 0) {
        <div class="card">
          <div class="card-body text-center py-5">
            <i class="ti ti-file-text fs-1 text-muted mb-3 d-block"></i>
            <p class="text-muted mb-3">No hay documentos todavía</p>
            <a routerLink="/docs/new" class="btn btn-primary">
              Crear el primero
            </a>
          </div>
        </div>
      } @else {
        <div class="card">
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Espacio</th>
                    <th>Última modificación</th>
                    <th style="width: 80px;"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (doc of docs(); track doc.id) {
                    <tr>
                      <td>
                        <a [routerLink]="['/docs', doc.id]" class="text-decoration-none fw-medium">
                          {{ doc.titulo }}
                        </a>
                      </td>
                      <td>
                        <span class="badge bg-secondary">{{ doc.espacioId }}</span>
                      </td>
                      <td class="text-muted">
                        {{ doc.updatedAt | date:'medium' }}
                      </td>
                      <td>
                        <div class="d-flex gap-1">
                          <a 
                            [routerLink]="['/docs', doc.id]" 
                            class="btn btn-sm btn-ghost-secondary"
                            title="Editar">
                            <i class="ti ti-edit"></i>
                          </a>
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
  `,
})
export class DocsListComponent implements OnInit {
  private docService = inject(DocService);

  docs = signal<Doc[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.docService.list().subscribe({
      next: (docs) => { this.docs.set(docs); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}