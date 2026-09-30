import { $view } from '@milkdown/utils';
import { codeBlockSchema } from '@milkdown/preset-commonmark';
import type { EditorView, NodeView, NodeViewConstructor, ViewMutationRecord } from '@milkdown/prose/view';
import type { Node as ProseMirrorNode } from '@milkdown/prose/model';
import mermaid from 'mermaid';
import { tablerCopy, tablerFileTypePng, tablerFileTypeSvg } from '@ng-icons/tabler-icons';

export type ViewMode = 'code' | 'graph' | 'both';
type RenderStatus = (success: boolean) => void;

mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', htmlLabels: false });

class MermaidCodeBlockView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;
  private readonly source: HTMLElement;
  private readonly graph: HTMLElement;
  private readonly error: HTMLElement;
  private readonly themeObserver: MutationObserver;
  private observedTheme: 'light' | 'dark';
  private mode: ViewMode = 'both';
  private sequence = 0;

  constructor(private node: ProseMirrorNode, private view: EditorView, private getPos: () => number | undefined, private readonly onRenderStatus: RenderStatus = () => {}) {
    this.dom = document.createElement('section');
    this.dom.className = 'gem-mermaid-node';
    this.dom.dataset['mode'] = this.mode;
    this.dom.setAttribute('aria-label', 'Mermaid diagram');
    const actions = document.createElement('div');
    actions.className = 'gem-mermaid-actions';
    const modes = document.createElement('div');
    modes.className = 'gem-mermaid-mode-actions';
    modes.append(this.button('Código', () => this.setMode('code')), this.button('Gráfico', () => this.setMode('graph')), this.button('Ambos', () => this.setMode('both')));
    const exports = document.createElement('div');
    exports.className = 'gem-mermaid-export-actions';
    exports.append(
      this.iconButton('copy', 'Copiar código Mermaid', () => void navigator.clipboard.writeText(this.text())),
      this.iconButton('svg', 'Descargar SVG', () => this.downloadSvg()),
      this.iconButton('png', 'Descargar PNG', () => void this.downloadPng()),
    );
    actions.append(modes, exports);
    this.source = document.createElement('pre');
    this.source.className = 'gem-mermaid-source';
    this.contentDOM = document.createElement('code');
    this.source.append(this.contentDOM);
    this.contentDOM.addEventListener('focus', () => this.setMode('code'));
    this.contentDOM.addEventListener('blur', () => this.setMode('both'));
    this.graph = document.createElement('div');
    this.graph.className = 'gem-mermaid-graph';
    this.error = document.createElement('div');
    this.error.className = 'gem-mermaid-error';
    this.dom.append(actions, this.source, this.graph, this.error);
    this.observedTheme = this.currentTheme();
    this.themeObserver = new MutationObserver(() => {
      const theme = this.currentTheme();
      if (theme === this.observedTheme) return;
      this.observedTheme = theme;
      void this.render();
    });
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-bs-theme', 'class'],
    });
    this.dom.addEventListener('click', (event) => {
      if (event.target instanceof HTMLButtonElement) event.stopPropagation();
    });
    if (String(node.attrs['language'] ?? '').toLowerCase() !== 'mermaid') {
      this.dom.className = 'gem-code-node';
      this.dom.replaceChildren(this.source);
      this.source.className = 'gem-code-source';
      this.source.style.display = 'block';
      return;
    }
    void this.render();
  }

  private button(label: string, action: () => void): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.addEventListener('mousedown', (event) => event.preventDefault());
    b.addEventListener('click', action);
    return b;
  }
  private iconButton(icon: 'copy' | 'svg' | 'png', label: string, action: () => void): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'gem-mermaid-icon-button';
    b.setAttribute('aria-label', label);
    b.title = label;
    b.innerHTML = icon === 'copy' ? tablerCopy : icon === 'svg' ? tablerFileTypeSvg : tablerFileTypePng;
    b.addEventListener('mousedown', (event) => event.preventDefault());
    b.addEventListener('click', action);
    return b;
  }
  private text(): string { return this.node.textContent; }
  private setMode(mode: ViewMode): void {
    this.mode = mode;
    this.dom.dataset['mode'] = mode;
    this.graph.style.display = mode === 'code' ? 'none' : 'block';
  }
  private async render(): Promise<void> {
    const sequence = ++this.sequence;
    this.error.textContent = '';
    const source = this.text();
    try {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        htmlLabels: false,
        theme: this.currentTheme() === 'dark' ? 'dark' : 'default',
      });
      const result = await mermaid.render(`gem-mermaid-node-${sequence}`, source);
      if (sequence !== this.sequence) return;
      // Mermaid generates this SVG from the user-authored diagram source. The
      // editor runs Mermaid in strict mode; inserting the generated SVG here
      // avoids a second sanitizer destroying its foreignObject labels.
      this.graph.innerHTML = result.svg;
      this.graph.style.display = this.mode === 'code' ? 'none' : 'block';
      const svg = this.graph.querySelector<SVGElement>('svg');
      if (svg) {
        svg.style.display = 'block';
        svg.style.maxWidth = '100%';
        svg.style.height = 'auto';
      }
      this.onRenderStatus(true);
    }
    catch (error) {
      if (sequence !== this.sequence) return;
      this.graph.replaceChildren();
      this.error.textContent = `Mermaid could not render this diagram: ${error instanceof Error ? error.message : 'invalid syntax'}`;
      this.onRenderStatus(false);
    }
  }
  update(node: ProseMirrorNode): boolean { if (node.type !== this.node.type || node.attrs['language'] !== this.node.attrs['language']) return false; this.node = node; void this.render(); return true; }
  selectNode(): void { this.dom.classList.add('ProseMirror-selectednode'); }
  deselectNode(): void { this.dom.classList.remove('ProseMirror-selectednode'); }
  stopEvent(event: Event): boolean { return event.target instanceof HTMLButtonElement; }
  destroy(): void { this.themeObserver.disconnect(); }
  ignoreMutation(record: ViewMutationRecord): boolean {
    if (record.type === 'selection') return true;
    // Only the editable code content belongs to ProseMirror's document. The
    // rendered SVG, error message, and action buttons are owned by the node
    // view and must not trigger a node-view recreation loop.
    return !this.contentDOM.contains(record.target as Node);
  }
  private downloadSvg(): void { const svg = this.graph.querySelector('svg'); if (svg) this.download(new Blob([svg.outerHTML], { type: 'image/svg+xml' }), 'mermaid.svg'); }
  private async downloadPng(): Promise<void> { const svg = this.graph.querySelector('svg'); if (!svg) return; const image = new Image(); const url = URL.createObjectURL(new Blob([svg.outerHTML], { type: 'image/svg+xml' })); try { await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(); image.src = url; }); const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth || 1200; canvas.height = image.naturalHeight || 800; canvas.getContext('2d')?.drawImage(image, 0, 0); const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png')); if (blob) this.download(blob, 'mermaid.png'); } finally { URL.revokeObjectURL(url); } }
  private download(blob: Blob, filename: string): void { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); URL.revokeObjectURL(a.href); }
  private currentTheme(): 'light' | 'dark' {
    return document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light';
  }
}

export function createMermaidCodeBlockView(onSuccess: () => void = () => {}, onFailure: () => void = () => {}) {
  return $view(
    codeBlockSchema.node,
    (): NodeViewConstructor => (node, view, getPos) => new MermaidCodeBlockView(node, view, getPos, (success) => {
      (success ? onSuccess : onFailure)();
    }),
  );
}

/** Backwards-compatible default registration for standalone consumers. */
export const mermaidCodeBlockView = createMermaidCodeBlockView();
