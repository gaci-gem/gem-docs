import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { ToolbarService } from './toolbar.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, MenuModule],
  template: `
    <div class="editor-toolbar" [class.disabled]="!toolbarService.editor()">
      <div class="toolbar-center">
        <!-- Inline formatting -->
        <div class="toolbar-group">
          <button class="toolbar-btn" title="Bold (Ctrl+B)" [class.toolbar-btn-active]="toolbarService.isActive('bold')" (click)="toolbarService.execCmd('toggleBold')" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
          </button>
          <button class="toolbar-btn" title="Italic (Ctrl+I)" [class.toolbar-btn-active]="toolbarService.isActive('italic')" (click)="toolbarService.execCmd('toggleItalic')" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
          </button>
          <button class="toolbar-btn" title="Underline (Ctrl+U)" [class.toolbar-btn-active]="toolbarService.isActive('underline')" (click)="toolbarService.execCmd('toggleUnderline')" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>
          </button>
          <button class="toolbar-btn" title="Strikethrough" [class.toolbar-btn-active]="toolbarService.isActive('strike')" (click)="toolbarService.execCmd('toggleStrike')" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" y1="12" x2="20" y2="12"/></svg>
          </button>
          <button class="toolbar-btn" title="Inline code" [class.toolbar-btn-active]="toolbarService.isActive('code')" (click)="toolbarService.execCmd('toggleCode')" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          </button>
        </div>

        <div class="toolbar-separator"></div>

        <!-- Headings -->
        <div class="toolbar-group">
          <button class="toolbar-btn toolbar-btn-text" title="Heading 1" [class.toolbar-btn-active]="toolbarService.isActive('heading', { level: 1 })" (click)="toolbarService.execCmd('toggleHeading', 1)" type="button">H1</button>
          <button class="toolbar-btn toolbar-btn-text" title="Heading 2" [class.toolbar-btn-active]="toolbarService.isActive('heading', { level: 2 })" (click)="toolbarService.execCmd('toggleHeading', 2)" type="button">H2</button>
          <button class="toolbar-btn toolbar-btn-text" title="Heading 3" [class.toolbar-btn-active]="toolbarService.isActive('heading', { level: 3 })" (click)="toolbarService.execCmd('toggleHeading', 3)" type="button">H3</button>
        </div>

        <div class="toolbar-separator"></div>

        <!-- Lists -->
        <div class="toolbar-group">
          <button class="toolbar-btn" title="Bullet list" [class.toolbar-btn-active]="toolbarService.isActive('bulletList')" (click)="toolbarService.execCmd('toggleBulletList')" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </button>
          <button class="toolbar-btn" title="Ordered list" [class.toolbar-btn-active]="toolbarService.isActive('orderedList')" (click)="toolbarService.execCmd('toggleOrderedList')" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
          </button>
          <button class="toolbar-btn" title="Task list" [class.toolbar-btn-active]="toolbarService.isActive('taskList')" (click)="toolbarService.execCmd('toggleTaskList')" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </button>
        </div>

        <div class="toolbar-separator"></div>

        <!-- Block elements -->
        <div class="toolbar-group">
          <button class="toolbar-btn" title="Blockquote" [class.toolbar-btn-active]="toolbarService.isActive('blockquote')" (click)="toolbarService.execCmd('toggleBlockquote')" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3"/></svg>
          </button>
          <button class="toolbar-btn" title="Code block" [class.toolbar-btn-active]="toolbarService.isActive('codeBlock')" (click)="toolbarService.execCmd('toggleCodeBlock')" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          </button>
          <button class="toolbar-btn" title="Horizontal rule" (click)="toolbarService.execCmd('setHorizontalRule')" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/></svg>
          </button>
        </div>

        <div class="toolbar-separator"></div>

        <!-- Link & Table -->
        <div class="toolbar-group">
          <button class="toolbar-btn" title="Insert link" [class.toolbar-btn-active]="toolbarService.isActive('link')" (click)="toolbarService.insertLink()" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </button>
          <button class="toolbar-btn" title="Insert table" (click)="toolbarService.insertTable()" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
          </button>
        </div>

        <div class="toolbar-separator"></div>

        <!-- Text alignment -->
        <div class="toolbar-group">
          <button class="toolbar-btn" title="Align left" [class.toolbar-btn-active]="toolbarService.isActive('textAlign', { align: 'left' })" (click)="toolbarService.execCmd('textAlign', 'left')" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
          </button>
          <button class="toolbar-btn" title="Align center" [class.toolbar-btn-active]="toolbarService.isActive('textAlign', { align: 'center' })" (click)="toolbarService.execCmd('textAlign', 'center')" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
          </button>
          <button class="toolbar-btn" title="Align right" [class.toolbar-btn-active]="toolbarService.isActive('textAlign', { align: 'right' })" (click)="toolbarService.execCmd('textAlign', 'right')" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>

        <div class="toolbar-separator"></div>

        <!-- Undo/Redo -->
        <div class="toolbar-group">
          <button class="toolbar-btn" title="Undo" (click)="toolbarService.execCmd('undo')" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
          </button>
          <button class="toolbar-btn" title="Redo" (click)="toolbarService.execCmd('redo')" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
          </button>
        </div>
      </div>

      <!-- Save status + dropdown more options button — right side -->
      <div class="toolbar-right">
        <!-- Save button -->
        <button
          class="btn-save"
          title="Guardar (Ctrl+S)"
          (click)="save.emit()"
          type="button">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          <span>Guardar</span>
        </button>

        <!-- Notion style "..." menu trigger for additional actions (Metadata, Import, Export) -->
        <button
          class="btn-more"
          title="Más opciones"
          (click)="menu.toggle($event)"
          type="button"
          aria-haspopup="true"
          [attr.aria-expanded]="false">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-more-horizontal"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
        </button>
        <p-menu #menu [model]="items" [popup]="true" appendTo="body" />

        <!-- Status indicator — always rendered so the 24px slot is reserved
             to the RIGHT of the Save button. Showing/hiding the SVG inside
             doesn't shift the layout. -->
        <span class="status-indicator" [class.status-saved]="toolbarService.saveStatus() === 'saved'">
          @if (toolbarService.saveStatus() === 'saved') {
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          }
        </span>
      </div>
    </div>
  `,
  styleUrl: './toolbar.component.scss',
  viewProviders: [],
})
export class ToolbarComponent {
  // Signal-based outputs (AGENTS.md: prefer output() over @Output decorator).
  save = output<void>();
  importDoc = output<void>();
  exportDocx = output<void>();
  exportPdf = output<void>();
  viewMetadata = output<void>();

  protected toolbarService = inject(ToolbarService);

  /**
   * Notion-style popup menu items. Groups Ver Metadata, Import, and Export actions.
   * re-emits the corresponding output so the parent (DocEditorComponent) handles each action.
   */
  protected readonly items: MenuItem[] = [
    {
      label: 'Ver metadata',
      icon: 'pi pi-tag',
      command: () => this.viewMetadata.emit(),
    },
    { separator: true },
    {
      label: 'Importar .docx',
      icon: 'pi pi-upload',
      command: () => this.importDoc.emit(),
    },
    { separator: true },
    {
      label: 'Exportar a .docx',
      icon: 'pi pi-file-word',
      title: 'Template GEM Default, alta fidelidad',
      command: () => this.exportDocx.emit(),
    },
    {
      label: 'Exportar a .pdf',
      icon: 'pi pi-file-pdf',
      title: 'Calidad media — abrí el .docx en Word para el PDF final',
      command: () => this.exportPdf.emit(),
    },
  ];
}