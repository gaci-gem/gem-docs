import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocService } from '@core/services/doc.service';
import { EspacioService } from '@core/services/espacio.service';
import { AuthService } from '@core/services/auth';
import { Doc } from '@core/interfaces/doc';
import { Espacio } from '@core/interfaces/espacio';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  template: `
    <div class="home">
      <h1>Bienvenido a GEM Docs</h1>
      <p>Tu sistema de documentación interno.</p>
      
      @if (docs().length === 0 && espacios().length === 0) {
        <div class="empty-state">
          <p>No hay documentos ni espacios todavía.</p>
          <a routerLink="/docs/new">Crear tu primer documento</a>
        </div>
      }
    </div>
  `,
})
export class HomeComponent {
  private docService = inject(DocService);
  private espacioService = inject(EspacioService);
  
  docs = signal<Doc[]>([]);
  espacios = signal<Espacio[]>([]);

  constructor() {
    this.docService.list().subscribe(docs => this.docs.set(docs));
    this.espacioService.list().subscribe(espacios => this.espacios.set(espacios));
  }
}