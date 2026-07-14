// =============================================================================
// Tiptap Editor Component — Simple template matching tiptap.dev
// Selector: tiptap-editor
// =============================================================================

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
  signal,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { debounceTime, Subject, takeUntil } from "rxjs";

// Tiptap core
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";

export interface TiptapConfig {
  placeholder?: string;
  readonly?: boolean;
  features?: {
    table?: boolean;
    link?: boolean;
    image?: boolean;
    textAlign?: boolean;
    underline?: boolean;
    taskList?: boolean;
    color?: boolean;
  };
  height?: string;
  maxWidth?: string;
}

type SaveStatus = "saved" | "saving" | "idle";

@Component({
  selector: "tiptap-editor",
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TiptapEditorComponent),
      multi: true,
    },
  ],
template: `
    <div class="tiptap-page">
      <!-- Toolbar — sticky top, centered like tiptap simple template -->
      <div class="editor-toolbar">
        <div class="toolbar-center">
          <!-- Inline formatting -->
          <div class="toolbar-group">
            <button class="toolbar-btn" title="Bold (Ctrl+B)" [class.toolbar-btn-active]="isActive('bold')" (click)="execCmd('toggleBold')" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
            </button>
            <button class="toolbar-btn" title="Italic (Ctrl+I)" [class.toolbar-btn-active]="isActive('italic')" (click)="execCmd('toggleItalic')" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
            </button>
            <button class="toolbar-btn" title="Underline (Ctrl+U)" [class.toolbar-btn-active]="isActive('underline')" (click)="execCmd('toggleUnderline')" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>
            </button>
            <button class="toolbar-btn" title="Strikethrough" [class.toolbar-btn-active]="isActive('strike')" (click)="execCmd('toggleStrike')" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" y1="12" x2="20" y2="12"/></svg>
            </button>
            <button class="toolbar-btn" title="Inline code" [class.toolbar-btn-active]="isActive('code')" (click)="execCmd('toggleCode')" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </button>
          </div>

          <div class="toolbar-separator"></div>

          <!-- Headings -->
          <div class="toolbar-group">
            <button class="toolbar-btn toolbar-btn-text" title="Heading 1" [class.toolbar-btn-active]="isActive('heading', { level: 1 })" (click)="execCmd('toggleHeading', 1)" type="button">H1</button>
            <button class="toolbar-btn toolbar-btn-text" title="Heading 2" [class.toolbar-btn-active]="isActive('heading', { level: 2 })" (click)="execCmd('toggleHeading', 2)" type="button">H2</button>
            <button class="toolbar-btn toolbar-btn-text" title="Heading 3" [class.toolbar-btn-active]="isActive('heading', { level: 3 })" (click)="execCmd('toggleHeading', 3)" type="button">H3</button>
          </div>

          <div class="toolbar-separator"></div>

          <!-- Lists -->
          <div class="toolbar-group">
            <button class="toolbar-btn" title="Bullet list" [class.toolbar-btn-active]="isActive('bulletList')" (click)="execCmd('toggleBulletList')" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </button>
            <button class="toolbar-btn" title="Ordered list" [class.toolbar-btn-active]="isActive('orderedList')" (click)="execCmd('toggleOrderedList')" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
            </button>
            <button class="toolbar-btn" title="Task list" [class.toolbar-btn-active]="isActive('taskList')" (click)="execCmd('toggleTaskList')" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </button>
          </div>

          <div class="toolbar-separator"></div>

          <!-- Block elements -->
          <div class="toolbar-group">
            <button class="toolbar-btn" title="Blockquote" [class.toolbar-btn-active]="isActive('blockquote')" (click)="execCmd('toggleBlockquote')" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3"/></svg>
            </button>
            <button class="toolbar-btn" title="Code block" [class.toolbar-btn-active]="isActive('codeBlock')" (click)="execCmd('toggleCodeBlock')" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </button>
            <button class="toolbar-btn" title="Horizontal rule" (click)="execCmd('setHorizontalRule')" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/></svg>
            </button>
          </div>

          <div class="toolbar-separator"></div>

          <!-- Link & Table -->
          <div class="toolbar-group">
            <button class="toolbar-btn" title="Insert link" [class.toolbar-btn-active]="isActive('link')" (click)="insertLink()" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            </button>
            <button class="toolbar-btn" title="Insert table" (click)="insertTable()" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
            </button>
          </div>

          <div class="toolbar-separator"></div>

          <!-- Text alignment -->
          <div class="toolbar-group">
            <button class="toolbar-btn" title="Align left" [class.toolbar-btn-active]="isActive('textAlign', { align: 'left' })" (click)="execCmd('textAlign', 'left')" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
            </button>
            <button class="toolbar-btn" title="Align center" [class.toolbar-btn-active]="isActive('textAlign', { align: 'center' })" (click)="execCmd('textAlign', 'center')" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
            </button>
            <button class="toolbar-btn" title="Align right" [class.toolbar-btn-active]="isActive('textAlign', { align: 'right' })" (click)="execCmd('textAlign', 'right')" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>

          <div class="toolbar-separator"></div>

          <!-- Undo/Redo -->
          <div class="toolbar-group">
            <button class="toolbar-btn" title="Undo" (click)="execCmd('undo')" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
            </button>
            <button class="toolbar-btn" title="Redo" (click)="execCmd('redo')" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
            </button>
          </div>
        </div>

        <!-- Save status — right side -->
        <div class="toolbar-right">
          <div class="save-status">
            @switch (saveStatus()) {
              @case ("saving") {
                <span class="status-saving">
                  <svg class="spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  <span class="status-text">Guardando...</span>
                </span>
              }
              @case ("saved") {
                <span class="status-saved">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span class="status-text">Guardado</span>
                </span>
              }
            }
          </div>
        </div>
      </div>

      <!-- Editor Container — full width, full height -->
      <div class="editor-content" [class.disabled]="disabled">
        <div class="editor-wrap">
          <div #editorRef class="tiptap ProseMirror"></div>
        </div>
      </div>
    </div>
  `,
  styleUrl: "./tiptap-editor.component.scss",
})
export class TiptapEditorComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @ViewChild("editorRef") editorRef!: ElementRef;

  @Input() config: TiptapConfig = {};
  @Input() disabled = false;
  @Input() initialContent = "";

  @Output() contentChange = new EventEmitter<string>();
  @Output() ready = new EventEmitter<void>();
  @Output() saveStatusChange = new EventEmitter<SaveStatus>();

  saveStatus = signal<SaveStatus>("idle");

  private editor?: Editor;
  private isInitialized = false;
  private currentContent = "";
  private saveSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private saveTimeout?: ReturnType<typeof setTimeout>;

  private onChange = (value: string) => {};
  private onTouched = () => {};

  ngOnInit() {
    this.saveSubject
      .pipe(debounceTime(800), takeUntil(this.destroy$))
      .subscribe(() => {
        this.saveStatus.set("saved");
        this.saveStatusChange.emit("saved");
        this.saveTimeout = setTimeout(() => {
          if (this.saveStatus() === "saved") {
            this.saveStatus.set("idle");
            this.saveStatusChange.emit("idle");
          }
        }, 2000);
      });
  }

  async ngAfterViewInit() {
    await this.initializeEditor();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    if (this.editor) {
      this.editor.destroy();
    }
  }

  writeValue(value: string): void {
    if (value !== undefined) {
      this.currentContent = value || "";
      if (this.isInitialized && this.editor) {
        this.editor.commands.setContent(this.currentContent);
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
    if (this.editor) {
      this.editor.setEditable(!isDisabled);
    }
  }

  private async initializeEditor(): Promise<void> {
    if (!this.editorRef?.nativeElement) {
      console.error("Editor reference not available");
      return;
    }

    try {
      await this.createEditor();
    } catch (error) {
      console.error("Error initializing Tiptap Editor:", error);
    }
  }

  private async createEditor(): Promise<void> {
    this.editor = new Editor({
      element: this.editorRef.nativeElement,
      content: this.currentContent,
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
        Underline,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: { rel: "noopener noreferrer" },
        }),
        Image.configure({ inline: false, allowBase64: true }),
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,
        TaskList,
        TaskItem.configure({ nested: true }),
        Typography,
        TextStyle,
        Color,
        Placeholder.configure({
          placeholder:
            this.config.placeholder ||
            "Escribí '/' para ver comandos o empezá a escribir...",
        }),
      ],
      editable: !this.disabled,
      editorProps: {
        attributes: {
          class: "tiptap ProseMirror",
        },
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        this.currentContent = html;
        this.contentChange.emit(html);
        this.onChange(html);

        this.saveStatus.set("saving");
        this.saveStatusChange.emit("saving");
        this.saveSubject.next(html);
      },
    });

    this.isInitialized = true;
    this.ready.emit();
  }

  /** Check if a mark/node is active in the current selection */
  isActive(type: string, attrs?: Record<string, any>): boolean {
    return this.editor?.isActive(type, attrs) ?? false;
  }

  /** Execute a Tiptap command */
  execCmd(command: string, payload?: unknown): void {
    if (!this.editor) return;

    const chain = this.editor.chain().focus();

    switch (command) {
      case "toggleBold":
        chain.toggleBold().run();
        break;
      case "toggleItalic":
        chain.toggleItalic().run();
        break;
      case "toggleUnderline":
        chain.toggleUnderline().run();
        break;
      case "toggleStrike":
        chain.toggleStrike().run();
        break;
      case "toggleCode":
        chain.toggleCode().run();
        break;
      case "toggleHeading":
        chain.toggleHeading({ level: ((payload as number) || 1) as 1 | 2 | 3 | 4 | 5 | 6 }).run();
        break;
      case "toggleBulletList":
        chain.toggleBulletList().run();
        break;
      case "toggleOrderedList":
        chain.toggleOrderedList().run();
        break;
      case "toggleTaskList":
        chain.toggleTaskList().run();
        break;
      case "toggleBlockquote":
        chain.toggleBlockquote().run();
        break;
      case "toggleCodeBlock":
        chain.toggleCodeBlock().run();
        break;
      case "setHorizontalRule":
        chain.setHorizontalRule().run();
        break;
      case "textAlign":
        chain.setTextAlign((payload as string) || "left").run();
        break;
      case "undo":
        chain.undo().run();
        break;
      case "redo":
        chain.redo().run();
        break;
    }
  }

  insertLink(): void {
    const previousUrl = this.editor?.getAttributes("link")['href'];
    const url = prompt("URL del enlace:", previousUrl || "");
    if (url === null) return;

    if (url === "") {
      this.editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    this.editor
      ?.chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }

  insertTable(): void {
    this.editor
      ?.chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }

  getHTML(): string {
    return this.editor?.getHTML() || "";
  }

  clearContent(): void {
    this.editor?.commands.clearContent();
    this.contentChange.emit("");
    this.onChange("");
  }
}