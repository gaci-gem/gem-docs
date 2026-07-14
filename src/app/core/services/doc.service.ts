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

  list(options?: { silent?: boolean }): Observable<Doc[]> {
    const headers = options?.silent ? { 'X-No-Loading': 'true' } : undefined;
    return this.http.get<Doc[]>(this.apiUrl, { headers });
  }

  getById(id: string): Observable<DocWithContent> {
    return this.http.get<DocWithContent>(`${this.apiUrl}/${id}`);
  }

  getByEspacio(espacioId: string): Observable<Doc[]> {
    const params = new HttpParams().set('espacioId', espacioId);
    return this.http.get<Doc[]>(`${this.apiUrl}/espacio/${espacioId}`);
  }

  getBacklinks(eventoId: string): Observable<Doc[]> {
    return this.http.get<Doc[]>(`${this.apiUrl}/evento/${eventoId}`);
  }

  create(doc: DocCreate, options?: { silent?: boolean }): Observable<DocWithContent> {
    const headers = options?.silent ? { 'X-No-Loading': 'true' } : undefined;
    return this.http.post<DocWithContent>(this.apiUrl, doc, { headers });
  }

  update(id: string, doc: DocUpdate, options?: { silent?: boolean }): Observable<DocWithContent> {
    const headers = options?.silent ? { 'X-No-Loading': 'true' } : undefined;
    return this.http.put<DocWithContent>(`${this.apiUrl}/${id}`, doc, { headers });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getLinks(docId: string): Observable<DocLink[]> {
    return this.http.get<DocLink[]>(`${this.apiUrl}/${docId}/links`);
  }
}