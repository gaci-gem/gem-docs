import { Injectable, signal } from '@angular/core';
import { Editor } from '@tiptap/core';

export type SaveStatus = 'idle' | 'saving' | 'saved';

@Injectable({ providedIn: 'root' })
export class ToolbarService {
  // The editor instance — set by EditorComponent on init
  private _editor = signal<Editor | null>(null);
  editor = this._editor.asReadonly();

  // Save status — set by EditorComponent or DocEditorComponent
  private _saveStatus = signal<SaveStatus>('idle');
  saveStatus = this._saveStatus.asReadonly();

  setEditor(editor: Editor | null): void {
    this._editor.set(editor);
  }

  setSaveStatus(status: SaveStatus): void {
    this._saveStatus.set(status);
  }

  isActive(type: string, attrs?: Record<string, unknown>): boolean {
    return this._editor()?.isActive(type, attrs) ?? false;
  }

  execCmd(command: string, payload?: unknown): void {
    const editor = this._editor();
    if (!editor) return;

    const chain = editor.chain().focus();
    switch (command) {
      case 'toggleBold':        chain.toggleBold().run(); break;
      case 'toggleItalic':      chain.toggleItalic().run(); break;
      case 'toggleUnderline':   chain.toggleUnderline().run(); break;
      case 'toggleStrike':      chain.toggleStrike().run(); break;
      case 'toggleCode':        chain.toggleCode().run(); break;
      case 'toggleHeading':
        chain.toggleHeading({ level: ((payload as number) || 1) as 1|2|3|4|5|6 }).run();
        break;
      case 'toggleBulletList':  chain.toggleBulletList().run(); break;
      case 'toggleOrderedList': chain.toggleOrderedList().run(); break;
      case 'toggleTaskList':    chain.toggleTaskList().run(); break;
      case 'toggleBlockquote':  chain.toggleBlockquote().run(); break;
      case 'toggleCodeBlock':   chain.toggleCodeBlock().run(); break;
      case 'setHorizontalRule': chain.setHorizontalRule().run(); break;
      case 'textAlign':
        chain.setTextAlign((payload as string) || 'left').run();
        break;
      case 'undo': chain.undo().run(); break;
      case 'redo': chain.redo().run(); break;
    }
  }

  insertLink(): void {
    const editor = this._editor();
    if (!editor) return;
    const previousUrl = editor.getAttributes('link')['href'] as string | undefined;
    const url = prompt('URL del enlace:', previousUrl || '');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  insertTable(): void {
    this._editor()?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }
}