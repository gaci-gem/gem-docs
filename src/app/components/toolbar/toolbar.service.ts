import { Injectable, signal } from '@angular/core';

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';
export interface EditorToolbarAdapter {
  isActive(type: string, attrs?: Record<string, unknown>): boolean;
  execCmd(command: string, payload?: unknown): void;
  insertLink(): void;
  insertTable(): void;
}

@Injectable({ providedIn: 'root' })
export class ToolbarService {
  private _editor = signal<EditorToolbarAdapter | null>(null);
  editor = this._editor.asReadonly();
  private _revision = signal(0);
  private _saveStatus = signal<SaveStatus>('idle');
  saveStatus = this._saveStatus.asReadonly();
  setEditor(editor: EditorToolbarAdapter | null): void { this._editor.set(editor); }
  refresh(): void { this._revision.update((revision) => revision + 1); }
  setSaveStatus(status: SaveStatus): void { this._saveStatus.set(status); }
  isActive(type: string, attrs?: Record<string, unknown>): boolean {
    this._revision();
    return this._editor()?.isActive(type, attrs) ?? false;
  }
  execCmd(command: string, payload?: unknown): void { this._editor()?.execCmd(command, payload); }
  insertLink(): void { this._editor()?.insertLink(); }
  insertTable(): void { this._editor()?.insertTable(); }
}
