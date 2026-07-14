import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
  DestroyRef,
  effect,
  forwardRef,
  input,
  output,
  signal,
  inject,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Tiptap core
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Typography from '@tiptap/extension-typography';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Markdown } from 'tiptap-markdown';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { ToolbarService } from '../toolbar/toolbar.service';
import { ImageLightboxService } from '@core/services/image-lightbox.service';

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

type SaveStatus = 'saved' | 'saving' | 'idle';

/**
 * Tiptap-based rich text editor with markdown-first persistence.
 *
 * - Reads parent input `initialContent` (markdown or legacy HTML).
 * - Emits `contentChange` as markdown on every edit (markdown-first).
 * - Supports paste-from-Word (MS-flavored HTML → clean markdown via Turndown).
 * - Implements ControlValueAccessor for future ngModel/formControl support,
 *   though the doc-editor currently binds it with input/output directly.
 */
@Component({
  selector: 'app-editor',
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EditorComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tiptap-page">
      <!-- Editor Container — full width, full height -->
      <div class="editor-content" [class.disabled]="effectiveDisabled()">
        <div class="editor-wrap" (click)="onEditorClick($event)">
          <div #editorRef class="tiptap ProseMirror"></div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './editor.component.scss',
})
export class EditorComponent implements ControlValueAccessor {
  private toolbarService = inject(ToolbarService);
  private imageLightbox = inject(ImageLightboxService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('editorRef') editorRef!: ElementRef;

  // ── Inputs (signal-based, AGENTS.md) ────────────────────────────────

  /** Tiptap configuration (placeholder, feature flags, dimensions). */
  config = input<TiptapConfig>({});

  /** Disabled state from parent — combined with CVA disabled below. */
  disabled = input(false);

  /** Initial content to load. Markdown-first; legacy HTML auto-detected. */
  initialContent = input('');

  // ── Outputs (signal-based, AGENTS.md) ───────────────────────────────

  /** Emits the editor's content as markdown on every change. */
  contentChange = output<string>();

  /** Fires once the Tiptap editor instance is fully initialized. */
  ready = output<void>();

  saveStatusChange = output<SaveStatus>();

  // ── Internal state ──────────────────────────────────────────────────

  private editor?: Editor;
  private isInitialized = false;
  private currentContent = '';
  /** Tracks disabled state coming from the ControlValueAccessor. */
  private cvaDisabled = signal(false);

  private turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    emDelimiter: '_',
  })
    // Enable GitHub-Flavored Markdown so Word tables (and strikethrough,
    // task lists) paste as proper Tiptap table nodes, not raw HTML.
    .use(gfm);

  private onChange = (_value: string) => {};
  private onTouched = () => {};

  constructor() {
    // React to changes of initialContent AFTER the editor is ready.
    // Runs once on construction (when isInitialized is still false → skipped),
    // and again whenever the parent updates initialContent post-init.
    effect(() => {
      const content = this.initialContent();
      if (this.isInitialized && this.editor && content !== this.currentContent) {
        this.loadContent(content || '');
      }
    });

    // Cleanup when the host component is destroyed.
    this.destroyRef.onDestroy(() => {
      this.toolbarService.setEditor(null);
      this.editor?.destroy();
    });
  }

  async ngAfterViewInit() {
    await this.initializeEditor();
  }

  /**
   * Click handler for the editor wrapper. Detects clicks on `<img>` elements
   * inside the rendered content and opens the image lightbox instead of
   * letting Tiptap select the image node.
   *
   * `stopPropagation` prevents Tiptap's node-selection logic from firing
   * alongside the lightbox open. We don't `preventDefault` so the browser
   * still treats the click normally (e.g., middle-click for new tab still
   * works).
   */
  onEditorClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (target && target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      if (img.src) {
        event.stopPropagation();
        this.imageLightbox.open(img.src);
      }
    }
  }

  // ── ControlValueAccessor (kept for future ngModel/formControl usage) ──

  writeValue(value: string): void {
    if (value !== undefined) {
      this.currentContent = value || '';
      if (this.isInitialized && this.editor) {
        this.loadContent(this.currentContent);
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
    this.cvaDisabled.set(isDisabled);
    this.editor?.setEditable(!isDisabled);
  }

  /** Combined disabled state from parent input + CVA. */
  protected effectiveDisabled(): boolean {
    return this.disabled() || this.cvaDisabled();
  }

  private async initializeEditor(): Promise<void> {
    if (!this.editorRef?.nativeElement) {
      console.error('Editor reference not available');
      return;
    }

    try {
      await this.createEditor();
    } catch (error) {
      console.error('Error initializing Tiptap Editor:', error);
    }
  }

  private async createEditor(): Promise<void> {
    this.editor = new Editor({
      element: this.editorRef.nativeElement,
      content: this.loadContentSync(this.initialContent()),
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          link: false,
          underline: false,
        }),
        Underline,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: { rel: 'noopener noreferrer' },
        }),
        Image.configure({ inline: false, allowBase64: true }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,
        TaskList,
        TaskItem.configure({ nested: true }),
        Typography,
        TextStyle,
        Color,
        Markdown.configure({
          html: false, // Don't allow raw HTML in markdown source
          breaks: true, // \n → <br>
          linkify: true, // Auto-link URLs
          transformPastedText: true,
        }),
        Placeholder.configure({
          placeholder:
            this.config().placeholder ||
            "Escribí '/' para ver comandos o empezá a escribir...",
        }),
      ],
      editable: !this.effectiveDisabled(),
      editorProps: {
        attributes: {
          class: 'tiptap ProseMirror',
        },
        /**
         * Detect when the user pastes content from Microsoft Word. Word copies
         * HTML with `class="Mso..."` markers and Word-specific tags (`<o:p>`,
         * `<v:*>`, `mso-*` styles). We intercept those pastes, run them through
         * Turndown to get clean markdown, and insert via tiptap-markdown so
         * the markdown-first architecture stays consistent.
         */
        handlePaste: (view, event) => {
          const html = event.clipboardData?.getData('text/html');
          if (!html) return false;
          const isWord =
            /class=["']?Mso/i.test(html) ||
            /<o:p\b/i.test(html) ||
            /<v:\w+/i.test(html) ||
            /mso-/i.test(html);
          if (!isWord) return false;

          event.preventDefault();
          const cleaned = this.cleanWordHtml(html);
          const markdown = this.turndown.turndown(cleaned);
          // tiptap-markdown overrides insertContent so it accepts markdown strings
          this.editor?.chain().focus().insertContent(markdown).run();
          return true;
        },
      },
      onUpdate: ({ editor }) => {
        // Save as markdown — markdown-first architecture
        const markdown = this.getMarkdownFromEditor();
        this.currentContent = markdown;
        this.contentChange.emit(markdown);
        this.onChange(markdown);
      },
    });

    this.isInitialized = true;
    // Register editor with ToolbarService
    this.toolbarService.setEditor(this.editor);
    this.ready.emit();

    // After initialization, force-load the parent's initialContent (the
    // constructor's effect ran when isInitialized was still false, so it
    // was skipped — we need to trigger a load now).
    const initial = this.initialContent();
    if (initial && initial !== this.currentContent) {
      this.loadContent(initial);
    }
  }

  /**
   * Loads content into the editor, detecting whether it's markdown or HTML.
   * - Markdown: starts with `#`, has markdown markers, or no HTML tags
   * - HTML: contains `<tag>` patterns (legacy content from before the markdown pivot)
   *
   * If tiptap-markdown's setMarkdown throws or isn't available, falls back to
   * setContent() so the editor never silently ends up empty.
   */
  private loadContent(content: string): void {
    if (!this.editor) return;
    if (this.looksLikeHtml(content)) {
      this.editor.commands.setContent(content);
      return;
    }

    const mdStorage = this.editor.storage as { markdown?: { setMarkdown?: (md: string) => void } };
    if (mdStorage.markdown?.setMarkdown) {
      try {
        mdStorage.markdown.setMarkdown(content);
        return;
      } catch (err) {
        console.error('[editor] setMarkdown failed, falling back to setContent:', err);
      }
    }

    // Fallback: if tiptap-markdown isn't loaded or threw, treat as plain HTML
    this.editor.commands.setContent(content);
  }

  /** Synchronous version used during initial editor creation (extension storage not ready) */
  private loadContentSync(content: string): string {
    // We pass through as-is; the Markdown extension will re-parse via setContent
    // on first onUpdate if needed. For initial load, plain string works.
    return content;
  }

  private getMarkdownFromEditor(): string {
    if (!this.editor) return '';
    const mdStorage = this.editor.storage as { markdown?: { getMarkdown?: () => string } };
    return mdStorage.markdown?.getMarkdown?.() ?? this.editor.getHTML();
  }

  /**
   * Strip Word-specific cruft from clipboard HTML before sending to Turndown:
   * `<style>` blocks (CSS definitions), `<head>` (meta/title), HTML comments
   * (including MS conditional comments), and Office namespace tags (`<o:*>`,
   * `<v:*>`, `<w:*>`, `<xml>`). Without this, the CSS dump ends up as text
   * in the markdown.
   */
  private cleanWordHtml(html: string): string {
    return html
      // <style>...</style> — CSS definitions
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
      // <head>...</head> — meta/title/etc.
      .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, '')
      // Self-closing tags
      .replace(/<meta\b[^>]*>/gi, '')
      .replace(/<link\b[^>]*>/gi, '')
      // Title content
      .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
      // HTML comments (incl. <!--[if gte mso 9]>...<![endif]-->)
      .replace(/<!--[\s\S]*?-->/g, '')
      // Office namespace tags: <o:p>, <v:shape>, <w:br>, <xml>, etc.
      .replace(/<\/?(?:o|v|w|xml)(?::\w+)?[^>]*>/gi, '');
  }

  private looksLikeHtml(content: string): boolean {
    return /<[a-z][^>]*>/i.test(content);
  }

  getHTML(): string {
    return this.editor?.getHTML() || '';
  }

  /** Returns the editor's content as markdown — used for saving to backend. */
  getMarkdown(): string {
    return this.getMarkdownFromEditor();
  }

  clearContent(): void {
    this.editor?.commands.clearContent();
    this.contentChange.emit('');
    this.onChange('');
  }
}
