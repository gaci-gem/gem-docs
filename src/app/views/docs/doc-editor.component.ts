import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DocService } from '@core/services/doc.service';
import { EspacioService } from '@core/services/espacio.service';
import { AuthService } from '@core/services/auth';
import { UserStorageService } from '@core/services/user-storage';
import { MilkdownEditorComponent } from '../../components/milkdown-editor/milkdown-editor.component';
import { Espacio } from '@core/interfaces/espacio';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-doc-editor',
  imports: [CommonModule, FormsModule, RouterLink, MilkdownEditorComponent],
  template: `
    <div class="doc-editor-page">
      <div class="doc-header d-flex align-items-center gap-3 mb-4">
        <a routerLink="/docs" class="btn btn-ghost-secondary">
          <i class="ti ti-arrow-left"></i>
        </a>
        <div class="flex-grow-1">
          <input 
            type="text" 
            [(ngModel)]="titulo" 
            placeholder="Título del documento"
            class="form-control form-control-lg title-input"
          />
        </div>
        
        <div class="d-flex align-items-center gap-2">
          @if (espacios().length > 0) {
            <select [(ngModel)]="espacioId" class="form-select" style="width: auto; min-width: 150px;">
              @for (espacio of espacios(); track espacio.id) {
                <option [value]="espacio.id">{{ espacio.nombre }}</option>
              }
            </select>
            <button 
              class="btn btn-ghost-secondary btn-sm"
              title="Crear nuevo espacio"
              (click)="showNewSpace.set(true)">
              <i class="ti ti-plus"></i>
            </button>
          } @else {
            <span class="text-muted small">No hay espacios</span>
            <button 
              class="btn btn-primary btn-sm"
              (click)="showNewSpace.set(true)">
              <i class="ti ti-plus me-1"></i>Crear espacio
            </button>
          }
        </div>

        <button 
          class="btn btn-primary" 
          (click)="save()" 
          [disabled]="saving() || !titulo.trim()">
          @if (saving()) {
            <span>Guardando...</span>
          } @else {
            <span>Guardar</span>
          }
        </button>
      </div>

      @if (showNewSpace()) {
        <div class="card mb-4">
          <div class="card-body py-3">
            <div class="d-flex align-items-center gap-2">
              <input 
                type="text" 
                [(ngModel)]="newSpaceName" 
                placeholder="Nombre del nuevo espacio"
                class="form-control form-control-sm"
                style="max-width: 250px;"
                (keyup.enter)="createSpace()"
              />
              <button 
                class="btn btn-primary btn-sm"
                (click)="createSpace()"
                [disabled]="!newSpaceName.trim() || creatingSpace()">
                @if (creatingSpace()) { Creando... } @else { Crear }
              </button>
              <button 
                class="btn btn-ghost-secondary btn-sm"
                (click)="showNewSpace.set(false); newSpaceName=''">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      }

      @if (autor()) {
        <div class="doc-meta mb-3">
          <span class="text-muted">
            <i class="ti ti-user me-1"></i>
            {{ autor()!.nombre }} {{ autor()!.apellido || '' }}
          </span>
          @if (docId) {
            <span class="text-muted ms-3">
              <i class="ti ti-edit me-1"></i>
              Editando documento existente
            </span>
          }
        </div>
      }

      @if (detectedLinks().length > 0) {
        <div class="links-info alert alert-info py-2 px-3 mb-3 d-flex align-items-center gap-2">
          <i class="ti ti-link"></i>
          <span>{{ detectedLinks().length }} link(s) detectados: {{ detectedLinks().join(', ') }}</span>
        </div>
      }

      <div class="editor-wrapper card">
        <div class="card-body p-0">
          <milkdown-editor 
            [initialContent]="contenido()" 
            (contentChange)="onContentChange($event)"
          />
        </div>
      </div>

      @if (errorMsg()) {
        <div class="alert alert-danger mt-3">
          {{ errorMsg() }}
        </div>
      }
    </div>
  `,
})
export class DocEditorComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private docService = inject(DocService);
  private espacioService = inject(EspacioService);
  private authService = inject(AuthService);
  private userStorage = inject(UserStorageService);

  docId: string | null = null;
  titulo = '';
  espacioId = '';
  contenido = signal('');
  saving = signal(false);
  creatingSpace = signal(false);
  errorMsg = signal('');
  espacios = signal<Espacio[]>([]);
  detectedLinks = signal<string[]>([]);
  showNewSpace = signal(false);
  newSpaceName = '';
  autor = toSignal(this.authService.currentUser$, { initialValue: null });

  private paramSub?: Subscription;

  ngOnInit(): void {
    this.loadSpaces();

    // Subscribe to route param changes to handle navigation between docs
    this.paramSub = this.route.paramMap.subscribe(params => {
      const newId = params.get('id');
      if (newId !== this.docId) {
        this.docId = newId;
        if (this.docId) {
          this.loadDoc(this.docId);
        } else {
          // New doc mode - reset fields
          this.titulo = '';
          this.contenido.set('');
          this.espacioId = this.espacios()[0]?.id || '';
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
  }

  private loadDoc(id: string): void {
    this.docService.getById(id).subscribe({
      next: (doc) => {
        this.titulo = doc.titulo;
        this.contenido.set(doc.content);
        this.espacioId = doc.espacioId;
        this.parseLinks(doc.content);
      },
      error: () => this.errorMsg.set('No se pudo cargar el documento')
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
      error: () => this.errorMsg.set('No se pudieron cargar los espacios')
    });
  }

  createSpace(): void {
    if (!this.newSpaceName.trim()) return;

    this.creatingSpace.set(true);
    this.errorMsg.set('');

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
        this.errorMsg.set('Error al crear el espacio');
      }
    });
  }

  onContentChange(content: string): void {
    this.contenido.set(content);
    this.parseLinks(content);
  }

  parseLinks(content: string): void {
    const eventoMatches = content.match(/@evento:\d+/g) || [];
    const usuarioMatches = content.match(/@usuario:\w+/g) || [];
    this.detectedLinks.set([...eventoMatches, ...usuarioMatches]);
  }

  save(): void {
    if (!this.titulo.trim()) return;

    if (!this.espacioId) {
      this.errorMsg.set('Selecciona o crea un espacio primero');
      return;
    }

    this.saving.set(true);
    this.errorMsg.set('');

    const contenido = this.contenido();
    const docData = {
      titulo: this.titulo,
      content: contenido,
      espacioId: this.espacioId
    };

    const observable = this.docId
      ? this.docService.update(this.docId, { titulo: this.titulo, content: contenido })
      : this.docService.create(docData);

    observable.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/docs']);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message || err?.message || JSON.stringify(err);
        this.errorMsg.set('Error al guardar: ' + msg);
      }
    });
  }
}