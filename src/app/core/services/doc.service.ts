import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { Doc, DocCreate, DocUpdate, DocWithContent } from '@core/interfaces/doc';
import { DocLink } from '@core/interfaces/doc-link';

@Injectable({ providedIn: 'root' })
export class DocService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.API_URL}/docs`;

  list(): Observable<Doc[]> {
    return this.http.get<Doc[]>(this.apiUrl);
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

  create(doc: DocCreate): Observable<DocWithContent> {
    return this.http.post<DocWithContent>(this.apiUrl, doc);
  }

  update(id: string, doc: DocUpdate): Observable<DocWithContent> {
    return this.http.put<DocWithContent>(`${this.apiUrl}/${id}`, doc);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getLinks(docId: string): Observable<DocLink[]> {
    return this.http.get<DocLink[]>(`${this.apiUrl}/${docId}/links`);
  }
}