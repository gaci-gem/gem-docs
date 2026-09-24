import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@/environments/environment';
import { Vault } from '@core/interfaces/vault';

@Injectable({ providedIn: 'root' })
export class VaultService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.API_URL}/vaults`;
  readonly activeVault = signal<Vault | null>(null);

  load(): void {
    this.http.get<Vault[]>(this.apiUrl).subscribe((vaults) => {
      this.activeVault.set(vaults.find((vault) => vault.isDefault) ?? vaults[0] ?? null);
    });
  }
}
