import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '@/environments/environment';

export interface PropertyValueCatalogEntry {
  id: string;
  propertyKey: string;
  value: string;
  color: string | null;
}

@Injectable({ providedIn: 'root' })
export class PropertyValueCatalogService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.API_URL}/docs/property-values`;

  list(espacioId: string, propertyKey?: string): Observable<PropertyValueCatalogEntry[]> {
    let params = new HttpParams().set('espacioId', espacioId);
    if (propertyKey) params = params.set('propertyKey', propertyKey);
    return this.http.get<PropertyValueCatalogEntry[]>(this.apiUrl, { params }).pipe(catchError(() => of([])));
  }

  register(espacioId: string, propertyKey: string, value: string, color?: string | null): Observable<PropertyValueCatalogEntry | null> {
    return this.http.post<PropertyValueCatalogEntry>(this.apiUrl, { espacioId, propertyKey, value, ...(color ? { color } : {}) }).pipe(catchError(() => of(null)));
  }

  updateColor(id: string, color: string | null): Observable<PropertyValueCatalogEntry | null> {
    return this.http.patch<PropertyValueCatalogEntry>(`${this.apiUrl}/${id}`, { color }).pipe(catchError(() => of(null)));
  }
}
