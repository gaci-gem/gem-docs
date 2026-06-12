import { Injectable, signal, computed } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  private _theme = signal<Theme>('system');
  private _sidenavOpen = signal(true);
  private _isDark = signal(false);

  theme = this._theme.asReadonly();
  sidenavOpen = this._sidenavOpen.asReadonly();
  isDark = this._isDark.asReadonly();

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    const stored = localStorage.getItem('gemdocs_theme') as Theme | null;
    if (stored) {
      this._theme.set(stored);
    }
    this.updateDark();
  }

  private updateDark(): void {
    const theme = this._theme();
    if (theme === 'system') {
      this._isDark.set(window.matchMedia('(prefers-color-scheme: dark)').matches);
    } else {
      this._isDark.set(theme === 'dark');
    }
  }

  toggleSidenav(): void {
    this._sidenavOpen.update(open => !open);
  }

  setTheme(theme: Theme): void {
    this._theme.set(theme);
    localStorage.setItem('gemdocs_theme', theme);
    this.updateDark();
  }

  toggleTheme(): void {
    const current = this._isDark();
    this.setTheme(current ? 'light' : 'dark');
  }
}