import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@/environments/environment';
import { Vault, VaultCreate } from '@core/interfaces/vault';

const STORAGE_KEY = 'gem-docs.active-vault';

@Injectable({ providedIn: 'root' })
export class VaultService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.API_URL}/vaults`;
  readonly active = signal<Vault | null>(null);

  list(): Observable<Vault[]> { return this.http.get<Vault[]>(this.apiUrl); }
  load(): Observable<Vault[]> { return this.initialize(); }
  create(dto: VaultCreate): Observable<Vault> { return this.http.post<Vault>(this.apiUrl, dto); }

  initialize(): Observable<Vault[]> {
    return this.list().pipe(tap(vaults => {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      const selected = vaults.find(v => v.id === stored) ?? vaults.find(v => v.isDefault) ?? vaults[0] ?? null;
      this.active.set(selected);
      if (selected) sessionStorage.setItem(STORAGE_KEY, selected.id);
    }));
  }

  select(vault: Vault): void {
    this.active.set(vault);
    sessionStorage.setItem(STORAGE_KEY, vault.id);
  }
}
