import {
  Component,
  ElementRef,
  ViewChild,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { Crepe } from "@milkdown/crepe";
import { NgIcon } from "@ng-icons/core";
import { debounceTime, Subject, takeUntil } from "rxjs";

export interface MilkdownConfig {
  placeholder?: string;
  readonly?: boolean;
  features?: {
    table?: boolean;
    linkTooltip?: boolean;
    imageBlock?: boolean;
    blockEdit?: boolean;
    listItem?: boolean;
    cursor?: boolean;
    placeholder?: boolean;
    latex?: boolean;
    codeMirror?: boolean;
  };
  height?: string;
  maxWidth?: string;
}

type SaveStatus = 'saved' | 'saving' | 'idle';

@Component({
  selector: 'milkdown-editor',
  standalone: true,
  imports: [CommonModule, NgIcon],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MilkdownEditorComponent),
      multi: true,
    },
  ],
  template: `
    <div class="milkdown-wrapper" [style.max-width]="config.maxWidth || '900px'">
      <!-- Toolbar hint — slash menu handles formatting -->
      <div class="milkdown-toolbar" [class.readonly]="isReadonly">
        <div class="toolbar-hint">
          <ng-icon name="tablerSlash" size="14"></ng-icon>
          <span>Escribe <code>/</code> para ver comandos</span>
        </div>

        <div class="toolbar-spacer"></div>

        <!-- Save status -->
        <div class="save-status">
          @switch (saveStatus()) {
            @case ('saving') {
              <span class="status-saving">
                <ng-icon name="tablerLoader" class="spin"></ng-icon>
                Guardando...
              </span>
            }
            @case ('saved') {
              <span class="status-saved">
                <ng-icon name="tablerCheck"></ng-icon>
                Guardado
              </span>
            }
          }
        </div>
      </div>

      <!-- Editor -->
      <div
        #editorRef
        class="milkdown-editor-container"
        [style.min-height]="config.height || '400px'"
        [class.disabled]="disabled"
      ></div>
    </div>
  `,
  styleUrl: './milkdown-editor.component.scss',
})
export class MilkdownEditorComponent implements OnInit, OnDestroy, OnChanges, ControlValueAccessor {
  @ViewChild("editorRef") editorRef!: ElementRef;

  @Input() config: MilkdownConfig = {};
  @Input() disabled: boolean = false;
  @Input() initialContent: string = '';

  @Output() contentChange = new EventEmitter<string>();
  @Output() ready = new EventEmitter<void>();
  @Output() saveStatusChange = new EventEmitter<SaveStatus>();

  isReadonly = false;
  saveStatus = signal<SaveStatus>('idle');

  private crepe?: Crepe;
  private isInitialized = false;
  private currentContent = '';
  private saveSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private saveTimeout?: ReturnType<typeof setTimeout>;

  private onChange = (value: string) => {};
  private onTouched = () => {};

  ngOnInit() {
    this.isReadonly = this.config.readonly || false;

    // Debounce para el indicador de guardado
    this.saveSubject.pipe(
      debounceTime(800),
      takeUntil(this.destroy$)
    ).subscribe(content => {
      this.saveStatus.set('saved');
      this.saveStatusChange.emit('saved');
      // Reset a idle después de 3s
      this.saveTimeout = setTimeout(() => {
        if (this.saveStatus() === 'saved') {
          this.saveStatus.set('idle');
          this.saveStatusChange.emit('idle');
        }
      }, 3000);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialContent'] && !changes['initialContent'].firstChange) {
      const newContent = changes['initialContent'].currentValue || '';
      if (newContent !== this.currentContent) {
        this.currentContent = newContent;
        if (this.isInitialized) {
          this.recreateEditor();
        }
      }
    }
  }

  async ngAfterViewInit() {
    await this.initializeEditor();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    if (this.crepe) {
      this.crepe.destroy();
    }
  }

  writeValue(value: string): void {
    if (value !== undefined) {
      this.currentContent = value || '';
      if (this.isInitialized) {
        this.recreateEditor();
      }
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (this.crepe) {
      this.crepe.setReadonly(isDisabled || this.isReadonly);
    }
  }

  private async initializeEditor(): Promise<void> {
    if (!this.editorRef?.nativeElement) {
      console.error('Editor reference not available');
      return;
    }

    try {
      await this.createEditor();
    } catch (error) {
      console.error("Error initializing Milkdown Editor:", error);
    }
  }

  private async createEditor(): Promise<void> {
    const features = {
      [Crepe.Feature.CodeMirror]: true,
      [Crepe.Feature.Table]: true,
      [Crepe.Feature.LinkTooltip]: true,
      [Crepe.Feature.ImageBlock]: true,
      [Crepe.Feature.BlockEdit]: true,
      [Crepe.Feature.ListItem]: true,
      [Crepe.Feature.Cursor]: true,
      [Crepe.Feature.Placeholder]: true,
      [Crepe.Feature.Latex]: true,
    };

    this.crepe = new Crepe({
      root: this.editorRef.nativeElement,
      defaultValue: this.currentContent,
      features,
    });

    await this.crepe.create();

    if (this.disabled || this.isReadonly) {
      this.crepe.setReadonly(true);
    }

    this.setupEventListeners();
    this.addCopyButtonsToCodeBlocks();
    this.isInitialized = true;
    this.ready.emit();
  }

  private async recreateEditor(): Promise<void> {
    if (this.crepe) {
      this.crepe.destroy();
    }
    await this.createEditor();
  }

  private setupEventListeners(): void {
    if (!this.crepe) return;

    this.crepe.on((listener) => {
      listener.markdownUpdated(() => {
        const markdown = this.crepe?.getMarkdown() || '';
        this.currentContent = markdown;
        this.contentChange.emit(markdown);
        this.onChange(markdown);

        // Trigger save indicator
        this.saveStatus.set('saving');
        this.saveStatusChange.emit('saving');
        this.saveSubject.next(markdown);
      });
    });
  }

  private addCopyButtonsToCodeBlocks(): void {
    // CodeMirror blocks get copy buttons added via MutationObserver
    // This is handled in SCSS with ::after pseudo-elements
  }

  // Public because called from template bindings
  execCmd(command: string, payload?: unknown): void {
    if (!this.crepe) return;

    try {
      const editor = (this.crepe as any).editor;
      if (!editor) return;

      const ctx = editor.ctx;
      if (!ctx) return;

      // Try to find and execute the command
      const schema = ctx.get(editor.namespace + '-schema' as any);
      if (!schema) return;

      const tr = editor.view.state.tr;
      const { from, to } = editor.view.state.selection;

      switch (command) {
        case 'toggleBold':
          tr.addMark(from, to, schema.marks.strong.create());
          break;
        case 'toggleItalic':
          tr.addMark(from, to, schema.marks.emphasis.create());
          break;
        case 'toggleStrikeThrough':
          tr.addMark(from, to, schema.marks.strikethrough.create());
          break;
        case 'toggleCode':
          tr.addMark(from, to, schema.marks.code.create());
          break;
        case 'turnIntoHeading':
          const level = payload as number;
          const headingType = schema.nodes[`heading${level}`] || schema.nodes.heading;
          if (headingType) {
            const node = headingType.create({}, from === to ? undefined : editor.view.state.doc.textBetween(from, to, ' '));
            tr.replaceWith(from, to, node);
          }
          break;
        case 'wrapInBulletList':
          // Use editor action to dispatch list command
          break;
        case 'wrapInOrderedList':
          break;
        case 'wrapInBlockquote':
          const quote = schema.nodes.blockquote.create();
          tr.replaceWith(from, to, quote);
          break;
        case 'wrapInCodeBlock':
          const codeBlock = schema.nodes.code_block.create();
          tr.replaceWith(from, to, codeBlock);
          break;
      }

      editor.view.dispatch(tr);
    } catch (e) {
      // Fallback: use keyboard shortcuts
      this.execCmdViaKeyboard(command);
    }
  }

  private execCmdViaKeyboard(command: string): void {
    const textarea = this.editorRef?.nativeElement.querySelector('.milkdown') as HTMLElement;
    if (!textarea) return;

    const selection = window.getSelection();
    if (!selection?.rangeCount) return;

    switch (command) {
      case 'toggleBold':
        document.execCommand('bold', false);
        break;
      case 'toggleItalic':
        document.execCommand('italic', false);
        break;
      case 'toggleUnderline':
        document.execCommand('underline', false);
        break;
      default:
        break;
    }
  }

  insertLink(): void {
    const url = prompt('URL del enlace:');
    if (!url) return;

    const selection = window.getSelection()?.toString() || 'Enlace';
    const markdown = `[${selection}](${url})`;
    this.insertMarkdownAtCursor(markdown);
  }

  insertTable(): void {
    const markdown = `\n| Título 1 | Título 2 | Título 3 |\n|----------|----------|----------|\n| Celda 1  | Celda 2  | Celda 3  |\n| Celda 4  | Celda 5  | Celda 6  |\n`;
    this.insertMarkdownAtCursor(markdown);
  }

  private insertMarkdownAtCursor(markdown: string): void {
    if (!this.crepe) return;

    try {
      const editor = (this.crepe as any).editor;
      if (!editor?.view) return;

      const tr = editor.view.state.tr;
      const { from, to } = editor.view.state.selection;
      const node = editor.view.state.schema.text(markdown);
      tr.replaceWith(from, to, node);
      editor.view.dispatch(tr);
    } catch (e) {
      // Fallback: append to current content
      const current = this.crepe.getMarkdown();
      this.setMarkdown(current + '\n' + markdown);
    }
  }

  getMarkdown(): string {
    return this.crepe?.getMarkdown() || this.currentContent;
  }

  setMarkdown(markdown: string): void {
    this.currentContent = markdown;
    if (this.isInitialized) {
      this.recreateEditor();
    }
  }

  setReadonly(readonly: boolean): void {
    this.isReadonly = readonly;
    if (this.crepe) {
      this.crepe.setReadonly(readonly || this.disabled);
    }
  }

  toggleReadonly(): void {
    this.setReadonly(!this.isReadonly);
  }

  clearContent(): void {
    this.setMarkdown('');
    this.contentChange.emit('');
    this.onChange('');
  }

  exportMarkdown(): void {
    const markdown = this.getMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }
}