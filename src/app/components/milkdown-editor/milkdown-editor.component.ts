import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Crepe } from '@milkdown/crepe';
import type { ReferenceTarget } from '@core/services/reference-drawer.service';
import { ImageUploadService } from '@core/services/image-upload.service';
import type { ExportReferenceCatalogEntry } from '@core/services/doc-export.service';
import { composeFrontmatter, splitFrontmatter } from '@core/markdown/frontmatter';
import { catchError, firstValueFrom, forkJoin, of } from 'rxjs';
import { mentionPlugin, MentionItem } from './mention-plugin';
import { UsuarioService } from '@core/services/usuario';
import { EventoService } from '@core/services/evento.service';
import { DocService } from '@core/services/doc.service';
import { FiltroActivo } from '@/app/constants/filtros_activo';
import { Router } from '@angular/router';
import { EditorToolbarAdapter, ToolbarService } from '../toolbar/toolbar.service';
import { commandsCtx, editorViewCtx } from '@milkdown/core';
import { insertHrCommand, toggleEmphasisCommand, toggleInlineCodeCommand, toggleStrongCommand, updateLinkCommand, wrapInBlockquoteCommand, wrapInBulletListCommand, wrapInHeadingCommand, wrapInOrderedListCommand } from '@milkdown/preset-commonmark';
import { insertTableCommand, setAlignCommand, toggleStrikethroughCommand } from '@milkdown/preset-gfm';
import { redoCommand, undoCommand } from '@milkdown/plugin-history';
import { createMermaidCodeBlockView, type ViewMode } from './mermaid-code-block';
import { googlePreviewPlugin } from './google-preview-plugin';

export interface MilkdownConfig {
  placeholder?: string;
  readonly?: boolean;
  features?: {
    toolbar?: boolean;
    table?: boolean;
    linkTooltip?: boolean;
    imageBlock?: boolean;
    blockEdit?: boolean;
    listItem?: boolean;
    cursor?: boolean;
    placeholder?: boolean;
    latex?: boolean;
    codeMirror?: boolean;
    clipboard?: boolean;
    indent?: boolean;
    imageInline?: boolean;
    tooltip?: boolean;
    listItemBlock?: boolean;
  };
  height?: string;
  maxWidth?: string;
}

/**
 * Small Angular adapter around Crepe for the first gem-docs integration.
 *
 * The contract is Markdown-in/Markdown-out. Frontmatter is preserved around
 * the editable body, while Mermaid, image uploads, Google previews, mentions,
 * and GEM reference events are integrated through focused plugins and outputs.
 * Unsupported Markdown may still be normalized by Crepe after the first edit;
 * this adapter does not silently claim a lossless round-trip for unknown syntax.
 */
@Component({
  selector: 'app-milkdown-editor',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MilkdownEditorComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="milkdown-page" [class.disabled]="effectiveDisabled()" [attr.data-view-mode]="viewMode()">
      <div #editorRef class="milkdown-content" role="textbox" aria-multiline="true"></div>
    </div>
  `,
  styleUrl: './milkdown-editor.component.scss',
})
export class MilkdownEditorComponent implements AfterViewInit, ControlValueAccessor, EditorToolbarAdapter {
  private readonly destroyRef = inject(DestroyRef);
  private readonly imageUpload = inject(ImageUploadService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly eventoService = inject(EventoService);
  private readonly docService = inject(DocService);
  private readonly router = inject(Router);
  private readonly toolbarService = inject(ToolbarService);

  @ViewChild('editorRef') private editorRef!: ElementRef<HTMLElement>;

  readonly config = input<MilkdownConfig>({});
  readonly disabled = input(false);
  readonly initialContent = input('');
  /** Existing document ID. New documents use the legacy global asset path until saved. */
  readonly documentId = input<string | null>(null);
  readonly viewMode = input<ViewMode>('both');

  readonly contentChange = output<string>();
  readonly ready = output<void>();
  readonly focusEvent = output<void>();
  readonly blurEvent = output<void>();
  readonly referenceOpen = output<Exclude<ReferenceTarget, null>>();
  readonly mermaidRenderStatus = output<boolean>();

  private readonly cvaDisabled = signal(false);
  private crepe?: Crepe;
  currentContent = '';
  private frontmatterPrefix = '';
  private initialized = false;
  private onChange = (_value: string) => {};
  private onTouched = () => {};
  private mentionItems: MentionItem[] = [];
  private mentionItemsVersion = 0;
  private mentionItemsPromise?: Promise<void>;
  private toolbarMouseDown?: (event: MouseEvent) => void;

  protected readonly effectiveDisabled = computed(() => this.disabled() || this.cvaDisabled());

  constructor() {
    effect(() => {
      const content = this.initialContent();
      if (this.initialized && content !== this.currentContent) {
        void this.recreateEditor(content);
      }
    });

    this.destroyRef.onDestroy(() => this.destroyEditor());
  }

  async ngAfterViewInit(): Promise<void> {
    this.setContent(this.initialContent());
    await this.createEditor();
  }

  writeValue(value: string): void {
    const content = value || '';
    this.setContent(content);
    if (this.initialized) void this.recreateEditor(content);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
    this.crepe?.setReadonly(this.effectiveDisabled() || this.config().readonly === true);
  }

  private async createEditor(): Promise<void> {
    this.loadMentionItems();
    const features = this.config().features ?? {};
    const { body } = splitFrontmatter(this.currentContent);
    this.crepe = new Crepe({
      root: this.editorRef.nativeElement,
      // Crepe edits only the Markdown body; the original prefix stays outside it.
      defaultValue: body,
      features: {
        [Crepe.Feature.Toolbar]: features.toolbar ?? true,
        [Crepe.Feature.Table]: features.table ?? true,
        [Crepe.Feature.LinkTooltip]: features.linkTooltip ?? true,
        [Crepe.Feature.ImageBlock]: features.imageBlock ?? true,
        [Crepe.Feature.BlockEdit]: features.blockEdit ?? true,
        [Crepe.Feature.ListItem]: features.listItem ?? true,
        [Crepe.Feature.Cursor]: features.cursor ?? true,
        [Crepe.Feature.Placeholder]: features.placeholder ?? Boolean(this.config().placeholder),
        [Crepe.Feature.Latex]: features.latex ?? true,
        [Crepe.Feature.CodeMirror]: features.codeMirror ?? true,
      },
      featureConfigs: {
        [Crepe.Feature.Toolbar]: {},
        ...(this.config().placeholder
          ? {
              [Crepe.Feature.Placeholder]: {
                text: this.config().placeholder,
                mode: 'block',
              },
            }
          : {}),
        [Crepe.Feature.ImageBlock]: { onUpload: this.uploadImage.bind(this) },
        [Crepe.Feature.BlockEdit]: {
          textGroup: {
            label: 'Texto',
            text: { label: 'Texto' },
            h1: { label: 'Título 1' },
            h2: { label: 'Título 2' },
            h3: { label: 'Título 3' },
            h4: { label: 'Título 4' },
            h5: { label: 'Título 5' },
            h6: { label: 'Título 6' },
            quote: { label: 'Cita' },
            divider: { label: 'Separador' },
          },
          listGroup: {
            label: 'Listas',
            bulletList: { label: 'Lista con viñetas' },
            orderedList: { label: 'Lista numerada' },
            taskList: { label: 'Lista de tareas' },
          },
          advancedGroup: {
            label: 'Avanzado',
            image: { label: 'Imagen' },
            codeBlock: { label: 'Código' },
            table: { label: 'Tabla' },
            math: { label: 'Fórmula matemática' },
          },
        },
      },
    });
    this.crepe.editor.use(mentionPlugin(() => this.mentionItems, (item) => {
      if (item.kind === 'page') void this.router.navigate(['/docs', item.id]);
      else this.referenceOpen.emit({ type: item.kind, id: item.id });
    }, () => this.mentionItemsVersion));
    this.crepe.editor.use(createMermaidCodeBlockView(() => this.mermaidRenderStatus.emit(true), () => this.mermaidRenderStatus.emit(false)));
    this.crepe.editor.use(googlePreviewPlugin);

    await this.crepe.create();
    this.toolbarService.setEditor(this);
    this.installToolbarFocusGuard();
    this.crepe?.setReadonly?.(this.effectiveDisabled() || this.config().readonly === true);
    this.crepe?.on?.((listener) => {
      listener.markdownUpdated(() => {
        this.toolbarService.refresh();
        const markdown = this.crepe?.getMarkdown() ?? this.currentContent;
        const content = composeFrontmatter(this.frontmatterPrefix, markdown);
        this.currentContent = content;
        this.contentChange.emit(content);
        this.onChange(content);
      });
      listener.focus(() => {
        this.toolbarService.refresh();
        this.focusEvent.emit();
        this.onTouched();
      });
      listener.blur(() => this.blurEvent.emit());
    });

    this.initialized = true;
    this.ready.emit();
  }

  private loadMentionItems(): Promise<void> {
    if (!this.mentionItemsPromise) {
      this.mentionItemsPromise = firstValueFrom(forkJoin({
        users: this.usuarioService.getAll(FiltroActivo.ALL).pipe(catchError(() => of([]))),
        events: this.eventoService.listComplete({ cerrado: FiltroActivo.ALL }).pipe(catchError(() => of([]))),
        docs: this.docService.list({ silent: true }).pipe(catchError(() => of([]))),
      })).then(({ users, events, docs }) => {
        this.mentionItems = [
          ...users.flatMap((user) => user.id ? [{ id: user.id, label: `@${user.nombre} ${user.apellido}`, kind: 'user' as const }] : []),
          ...events.flatMap((event) => event.id ? [{ id: event.id, label: `#${event.tipoCodigo ?? event.tipo?.codigo ?? ''}-${event.numero ?? ''} | ${event.titulo ?? ''}`, kind: 'event' as const }] : []),
          ...docs.map((doc) => ({ id: doc.id, label: doc.titulo, kind: 'page' as const })),
        ];
        this.mentionItemsVersion++;
      });
    }
    return this.mentionItemsPromise;
  }

  async getExportReferenceCatalog(): Promise<ExportReferenceCatalogEntry[]> {
    await this.loadMentionItems();
    return this.mentionItems.map(({ id, label, kind }) => ({ id, label, kind }));
  }

  private async uploadImage(file: File): Promise<string> {
    const result = await firstValueFrom(
      this.imageUpload.upload(file, this.documentId() || undefined),
    );
    return result.url;
  }

  private async recreateEditor(content: string): Promise<void> {
    this.destroyEditor();
    this.setContent(content);
    await this.createEditor();
  }

  /**
   * Crepe runs commands on pointerdown, but browsers can still move focus to
   * the toolbar during the following mousedown. Preventing that native focus
   * change keeps the ProseMirror selection/caret available to the command.
   */
  private installToolbarFocusGuard(): void {
    this.toolbarMouseDown = (event: MouseEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('.milkdown-toolbar .toolbar-item')
      ) {
        event.preventDefault();
      }
    };
    // Crepe mounts its floating tooltip outside the Angular component host,
    // so listening on editorRef never sees toolbar events.
    document.addEventListener('mousedown', this.toolbarMouseDown, true);
  }

  private setContent(content: string): void {
    const parts = splitFrontmatter(content);
    this.frontmatterPrefix = parts.prefix;
    this.currentContent = content;
  }

  private destroyEditor(): void {
    this.toolbarService.setEditor(null);
    if (this.toolbarMouseDown) {
      document.removeEventListener('mousedown', this.toolbarMouseDown, true);
    }
    this.toolbarMouseDown = undefined;
    this.crepe?.destroy();
    this.crepe = undefined;
    this.initialized = false;
  }

  isActive(type: string, attrs?: Record<string, unknown>): boolean {
    if (!this.crepe) return false;
    let active = false;
    this.crepe.editor.action((ctx) => {
      const { state } = ctx.get(editorViewCtx);
      const { from, $from, empty } = state.selection;
      const mark = (name: string) => {
        const markType = state.schema.marks[name];
        return Boolean(markType && (empty ? markType.isInSet(state.storedMarks ?? $from.marks()) : state.doc.rangeHasMark(from, state.selection.to, markType)));
      };
      if (['bold', 'italic', 'underline', 'strike', 'code'].includes(type)) {
        active = mark(type === 'bold' ? 'strong' : type === 'italic' ? 'emphasis' : type === 'strike' ? 'strikethrough' : type);
      } else if (type === 'heading') {
        active = $from.parent.type.name === 'heading' && $from.parent.attrs['level'] === attrs?.['level'];
      } else {
        active = $from.parent.type.name === type || Boolean($from.node(-1)?.type.name === type);
      }
    });
    return active;
  }
  execCmd(command: string, payload?: unknown): void {
    const commands: Record<string, unknown> = {
      toggleBold: toggleStrongCommand, toggleItalic: toggleEmphasisCommand,
      toggleCode: toggleInlineCodeCommand, toggleStrike: toggleStrikethroughCommand,
      toggleHeading: wrapInHeadingCommand, toggleBulletList: wrapInBulletListCommand,
      toggleOrderedList: wrapInOrderedListCommand, toggleBlockquote: wrapInBlockquoteCommand,
      setHorizontalRule: insertHrCommand, textAlign: setAlignCommand, insertLink: updateLinkCommand,
      undo: undoCommand, redo: redoCommand,
    };
    const commandKey = commands[command];
    if (commandKey) {
      this.crepe?.editor.action((ctx) => {
        const command = commandKey as { key: unknown };
        ctx.get(commandsCtx).call(command.key as never, payload);
      });
      this.toolbarService.refresh();
    }
  }
  insertLink(): void {
    const href = prompt('URL del enlace:', '');
    if (href) this.execCmd('insertLink', { href });
  }
  insertTable(): void { this.crepe?.editor.action((ctx) => ctx.get(commandsCtx).call(insertTableCommand as never, { row: 3, col: 3 })); }
}
