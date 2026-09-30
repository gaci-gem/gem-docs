import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { environment } from '@/environments/environment';
import { Espacio, EspacioCreate } from '@core/interfaces/espacio';

@Injectable({ providedIn: 'root' })
export class EspacioService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.API_URL}/espacios`;

  list(options?: { silent?: boolean; vaultId?: string }): Observable<Espacio[]> {
    const headers = options?.silent ? { 'X-No-Loading': 'true' } : undefined;
    let params = new HttpParams();
    if (options?.vaultId) params = params.set('vaultId', options.vaultId);
    return this.http.get<Espacio[]>(this.apiUrl, { headers, params });
  }

  getById(id: string, vaultId?: string): Observable<Espacio> {
    let params = new HttpParams();
    if (vaultId) params = params.set('vaultId', vaultId);
    return this.http.get<Espacio>(`${this.apiUrl}/${id}`, { params });
  }

  create(espacio: EspacioCreate, vaultId?: string): Observable<Espacio> {
    let params = new HttpParams();
    if (vaultId) params = params.set('vaultId', vaultId);
    return this.http.post<Espacio>(this.apiUrl, espacio, { params });
  }

  update(id: string, espacio: Partial<EspacioCreate>): Observable<Espacio> {
    return this.http.patch<Espacio>(`${this.apiUrl}/${id}`, espacio);
  }

  delete(id: string, vaultId?: string): Observable<void> {
    let params = new HttpParams();
    if (vaultId) params = params.set('vaultId', vaultId);
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { params });
  }
}
