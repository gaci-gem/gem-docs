import { ShortcutKey } from '@/app/constants/shortcut';
import { Injectable, OnDestroy } from '@angular/core';
import { filter, fromEvent, map, Observable, shareReplay, Subject, takeUntil } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ShortcutService implements OnDestroy {
  private destroy$ = new Subject<void>();

  private keydown$ = fromEvent<KeyboardEvent>(document, 'keydown').pipe(
    filter(event => !event.repeat),
    map(event => {
      const combo = this.normalizeShortcut(event);

      // Lista de combos para los que queremos evitar el comportamiento por defecto
      const combosPreventDefault = ['CTRL+S', 'ALT+A', 'ALT+N', 'ESCAPE'];

      if (combosPreventDefault.includes(combo.toUpperCase())) {
        event.preventDefault();
      }

      return combo;
    }),
    takeUntil(this.destroy$)
  );

  onShortcut(): Observable<string> {
    return this.keydown$;
  }

  private normalizeShortcut(event: KeyboardEvent): string {
    let combo = '';
    if (event.ctrlKey) combo += 'Ctrl+';
    if (event.altKey) combo += 'Alt+';
    if (event.shiftKey) combo += 'Shift+';
    return combo + event.key.toUpperCase();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}