import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { Espacio, EspacioCreate } from '@core/interfaces/espacio';

@Injectable({ providedIn: 'root' })
export class EspacioService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.API_URL}/espacios`;

  list(): Observable<Espacio[]> {
    return this.http.get<Espacio[]>(this.apiUrl);
  }

  getById(id: string): Observable<Espacio> {
    return this.http.get<Espacio>(`${this.apiUrl}/${id}`);
  }

  create(espacio: EspacioCreate): Observable<Espacio> {
    return this.http.post<Espacio>(this.apiUrl, espacio);
  }

  update(id: string, espacio: Partial<EspacioCreate>): Observable<Espacio> {
    return this.http.patch<Espacio>(`${this.apiUrl}/${id}`, espacio);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}