import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '@/environments/environment';
import { Doc, DocCreate, DocUpdate, DocWithContent } from '@core/interfaces/doc';
import { DocLink } from '@core/interfaces/doc-link';

@Injectable({ providedIn: 'root' })
export class DocService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.API_URL}/docs`;

  /** Emits after any create/update so the sidebar (and other consumers) can refresh */
  changes$ = new Subject<void>();

  /** Convenience: emit a change notification */
  notifyChanges(): void {
    this.changes$.next();
  }

  list(options?: { silent?: boolean; vaultId?: string }): Observable<Doc[]> {
    const headers = options?.silent ? { 'X-No-Loading': 'true' } : undefined;
    let params = new HttpParams();
    if (options?.vaultId) params = params.set('vaultId', options.vaultId);
    return this.http.get<Doc[]>(this.apiUrl, { headers, params });
  }

  getById(id: string, vaultId?: string): Observable<DocWithContent> {
    let params = new HttpParams();
    if (vaultId) params = params.set('vaultId', vaultId);
    return this.http.get<DocWithContent>(`${this.apiUrl}/${id}`, { params });
  }

  getByEspacio(espacioId: string, vaultId?: string): Observable<Doc[]> {
    let params = new HttpParams().set('espacioId', espacioId);
    if (vaultId) params = params.set('vaultId', vaultId);
    return this.http.get<Doc[]>(`${this.apiUrl}/espacio/${espacioId}`, { params });
  }

  getBacklinks(eventoId: string): Observable<Doc[]> {
    return this.http.get<Doc[]>(`${this.apiUrl}/evento/${eventoId}`);
  }

  create(doc: DocCreate, options?: { silent?: boolean; vaultId?: string }): Observable<DocWithContent> {
    const headers = options?.silent ? { 'X-No-Loading': 'true' } : undefined;
    let params = new HttpParams();
    if (options?.vaultId) params = params.set('vaultId', options.vaultId);
    return this.http.post<DocWithContent>(this.apiUrl, doc, { headers, params });
  }

  update(id: string, doc: DocUpdate, options?: { silent?: boolean; vaultId?: string }): Observable<DocWithContent> {
    const headers = options?.silent ? { 'X-No-Loading': 'true' } : undefined;
    let params = new HttpParams();
    if (options?.vaultId) params = params.set('vaultId', options.vaultId);
    return this.http.put<DocWithContent>(`${this.apiUrl}/${id}`, doc, { headers, params });
  }

  delete(id: string, vaultId?: string): Observable<void> {
    let params = new HttpParams();
    if (vaultId) params = params.set('vaultId', vaultId);
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { params });
  }

  getLinks(docId: string): Observable<DocLink[]> {
    return this.http.get<DocLink[]>(`${this.apiUrl}/${docId}/links`);
  }
}
