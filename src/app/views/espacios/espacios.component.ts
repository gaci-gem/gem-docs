import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EspacioService } from '@core/services/espacio.service';
import { Espacio } from '@core/interfaces/espacio';

@Component({
  selector: 'app-espacios',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="espacios-page">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">Espacios</h4>
        <button class="btn btn-primary" (click)="showForm.set(true)">
          <i class="ti ti-plus me-1"></i>
          Nuevo espacio
        </button>
      </div>

      <!-- Formulario de creación -->
      @if (showForm()) {
        <div class="card mb-4">
          <div class="card-body">
            <h5 class="card-title mb-3">Nuevo espacio</h5>
            <div class="row g-3">
              <div class="col-md-6">
                <input 
                  type="text" 
                  [(ngModel)]="newNombre" 
                  placeholder="Nombre del espacio"
                  class="form-control"
                />
              </div>
              <div class="col-md-6">
                <input 
                  type="text" 
                  [(ngModel)]="newDescripcion" 
                  placeholder="Descripción (opcional)"
                  class="form-control"
                />
              </div>
              <div class="col-12 d-flex gap-2">
                <button 
                  class="btn btn-primary" 
                  (click)="create()"
                  [disabled]="!newNombre.trim() || saving()">
                  @if (saving()) { Creando... } @else { Crear espacio }
                </button>
                <button 
                  class="btn btn-ghost-secondary" 
                  (click)="showForm.set(false); newNombre=''; newDescripcion=''">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      @if (loading()) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
        </div>
      } @else if (espacios().length === 0) {
        <div class="card">
          <div class="card-body text-center py-5">
            <i class="ti ti-folder fs-1 text-muted mb-3 d-block"></i>
            <p class="text-muted mb-3">No hay espacios todavía</p>
            <button class="btn btn-primary" (click)="showForm.set(true)">
              Crear el primero
            </button>
          </div>
        </div>
      } @else {
        <div class="row g-3">
          @for (espacio of espacios(); track espacio.id) {
            <div class="col-md-4">
              <div class="card h-100">
                <div class="card-body">
                  <div class="d-flex align-items-start justify-content-between">
                    <div>
                      <h5 class="card-title mb-1">{{ espacio.nombre }}</h5>
                      @if (espacio.descripcion) {
                        <p class="text-muted small mb-0">{{ espacio.descripcion }}</p>
                      } @else {
                        <p class="text-muted small mb-0 fst-italic">Sin descripción</p>
                      }
                    </div>
                    <i class="ti ti-folder text-muted"></i>
                  </div>
                </div>
                <div class="card-footer bg-transparent">
                  <a 
                    [routerLink]="['/docs']" 
                    [queryParams]="{espacioId: espacio.id}"
                    class="btn btn-sm btn-ghost-secondary">
                    Ver documentos
                  </a>
                </div>
              </div>
            </div>
          }
        </div>
      }

      @if (errorMsg()) {
        <div class="alert alert-danger mt-3">
          {{ errorMsg() }}
        </div>
      }
    </div>
  `,
})
export class EspaciosComponent implements OnInit {
  private espacioService = inject(EspacioService);

  espacios = signal<Espacio[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);
  errorMsg = signal('');
  newNombre = '';
  newDescripcion = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.espacioService.list().subscribe({
      // Only show root-level spaces here. Sub-spaces are reachable by clicking
      // into the parent space's grid in DocsListComponent.
      next: (espacios) => {
        this.espacios.set(espacios.filter((e) => !e.parentId));
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.errorMsg.set('No se pudieron cargar los espacios'); }
    });
  }

  create(): void {
    if (!this.newNombre.trim()) return;

    this.saving.set(true);
    this.errorMsg.set('');

    this.espacioService.create({ 
      nombre: this.newNombre, 
      descripcion: this.newDescripcion || null 
    }).subscribe({
      next: () => {
        this.newNombre = '';
        this.newDescripcion = '';
        this.showForm.set(false);
        this.saving.set(false);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMsg.set('Error al crear el espacio');
      }
    });
  }
}