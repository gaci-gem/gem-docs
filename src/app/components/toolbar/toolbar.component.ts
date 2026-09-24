import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { ToolbarService } from './toolbar.service';

@Component({
  selector: 'app-toolbar',
  imports: [CommonModule, NgIcon, MenuModule],
  template: `
    <div class="editor-toolbar" (mousedown)="preserveEditorSelection($event)">
      <div class="toolbar-center">
        <div class="toolbar-group">
          <button class="toolbar-btn toolbar-btn-text" title="Título 1" [class.toolbar-btn-active]="toolbarService.isActive('heading', { level: 1 })" (click)="toolbarService.execCmd('toggleHeading', 1)" type="button">H1</button>
          <button class="toolbar-btn toolbar-btn-text" title="Título 2" [class.toolbar-btn-active]="toolbarService.isActive('heading', { level: 2 })" (click)="toolbarService.execCmd('toggleHeading', 2)" type="button">H2</button>
          <button class="toolbar-btn toolbar-btn-text" title="Título 3" [class.toolbar-btn-active]="toolbarService.isActive('heading', { level: 3 })" (click)="toolbarService.execCmd('toggleHeading', 3)" type="button">H3</button>
        </div>
        <div class="toolbar-separator"></div>

        <div class="toolbar-group">
          <button class="toolbar-btn" title="Negrita (Ctrl+B)" [class.toolbar-btn-active]="toolbarService.isActive('bold')" (click)="toolbarService.execCmd('toggleBold')" type="button"><ng-icon name="lucideBold" size="16" /></button>
          <button class="toolbar-btn" title="Cursiva (Ctrl+I)" [class.toolbar-btn-active]="toolbarService.isActive('italic')" (click)="toolbarService.execCmd('toggleItalic')" type="button"><ng-icon name="lucideItalic" size="16" /></button>
          <button class="toolbar-btn" title="Tachado" [class.toolbar-btn-active]="toolbarService.isActive('strike')" (click)="toolbarService.execCmd('toggleStrike')" type="button"><ng-icon name="lucideStrikethrough" size="16" /></button>
        </div>
        <div class="toolbar-separator"></div>

        <div class="toolbar-group">
          <button class="toolbar-btn" title="Código en línea" [class.toolbar-btn-active]="toolbarService.isActive('code')" (click)="toolbarService.execCmd('toggleCode')" type="button"><ng-icon name="lucideCode" size="16" /></button>
          <button class="toolbar-btn" title="Cita" [class.toolbar-btn-active]="toolbarService.isActive('blockquote')" (click)="toolbarService.execCmd('toggleBlockquote')" type="button"><ng-icon name="lucideQuote" size="16" /></button>
          <button class="toolbar-btn" title="Línea horizontal" (click)="toolbarService.execCmd('setHorizontalRule')" type="button"><ng-icon name="lucideMinus" size="16" /></button>
          <button class="toolbar-btn" title="Insertar enlace" [class.toolbar-btn-active]="toolbarService.isActive('link')" (click)="toolbarService.insertLink()" type="button"><ng-icon name="lucideLink" size="16" /></button>
        </div>
        <div class="toolbar-separator"></div>

        <div class="toolbar-group">
          <button class="toolbar-btn" title="Deshacer" (click)="toolbarService.execCmd('undo')" type="button"><ng-icon name="lucideUndo2" size="16" /></button>
          <button class="toolbar-btn" title="Rehacer" (click)="toolbarService.execCmd('redo')" type="button"><ng-icon name="lucideRedo2" size="16" /></button>
        </div>
      </div>

      <div class="toolbar-right">
        <button class="btn-properties" [attr.aria-label]="propertiesVisible() ? 'Ocultar propiedades' : 'Mostrar propiedades'" [title]="propertiesVisible() ? 'Ocultar propiedades' : 'Mostrar propiedades'" (click)="toggleProperties.emit()" type="button"><ng-icon [name]="propertiesVisible() ? 'lucidePanelRightClose' : 'lucidePanelRightOpen'" size="16" /></button>
        <button class="btn-properties" aria-label="Guardar" title="Guardar (Ctrl+S)" (click)="save.emit()" type="button"><ng-icon name="lucideSave" size="16" /></button>
        <button class="btn-properties" aria-label="Más opciones" title="Más opciones" (click)="menu.toggle($event)" type="button" aria-haspopup="true" [attr.aria-expanded]="false"><ng-icon name="lucideMoreHorizontal" size="16" /></button>
        <p-menu #menu [model]="items" [popup]="true" appendTo="body" />
        <span class="status-indicator" [class.status-saved]="toolbarService.saveStatus() === 'saved'" [class.status-error]="toolbarService.saveStatus() === 'error'" role="status" aria-live="polite">
          @switch (toolbarService.saveStatus()) {
            @case ('dirty') { <span>Sin guardar</span> }
            @case ('saving') { <span>Guardando...</span> }
            @case ('saved') { <span>Guardado</span> }
            @case ('error') { <button type="button" class="status-retry" (click)="save.emit()">Reintentar</button> }
          }
        </span>
      </div>
    </div>
  `,
  styleUrl: './toolbar.component.scss',
})
export class ToolbarComponent {
  save = output<void>();
  importDoc = output<void>();
  exportDocx = output<void>();
  exportPdf = output<void>();
  viewMetadata = output<void>();
  toggleProperties = output<void>();
  propertiesVisible = input(true);

  protected toolbarService = inject(ToolbarService);

  protected preserveEditorSelection(event: MouseEvent): void {
    if (event.target instanceof HTMLElement && event.target.closest('.toolbar-btn')) event.preventDefault();
  }

  protected readonly items: MenuItem[] = [
    { label: 'Ver propiedades', icon: 'pi pi-tag', command: () => this.viewMetadata.emit() },
    { separator: true },
    { label: 'Importar .docx', icon: 'pi pi-upload', command: () => this.importDoc.emit() },
    { separator: true },
    { label: 'Exportar a .docx', icon: 'pi pi-file-word', title: 'Template GEM Default, alta fidelidad', command: () => this.exportDocx.emit() },
    { label: 'Exportar a .pdf', icon: 'pi pi-file-pdf', title: 'Calidad media — abrí el .docx en Word para el PDF final', command: () => this.exportPdf.emit() },
  ];
}
