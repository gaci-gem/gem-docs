import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Evento, EventoCompleto } from '@core/interfaces/evento';
import { FiltroActivo } from '@/app/constants/filtros_activo';

export interface EventoListOptions {
  cerrado?: FiltroActivo;
}

@Injectable({ providedIn: 'root' })
export class EventoService {
  private http = inject(HttpClient);

  /** Lists events from the canonical gem-api endpoint. */
  list(options?: EventoListOptions): Observable<Evento[]> {
    let params = new HttpParams();
    if (options?.cerrado) params = params.set('cerrado', options.cerrado);
    return this.http.get<Evento[]>(`${environment.API_URL}/evento`, { params });
  }

  /** Lists events with their related type, including the type color. */
  listComplete(options?: EventoListOptions): Observable<EventoCompleto[]> {
    let params = new HttpParams();
    if (options?.cerrado) params = params.set('cerrado', options.cerrado);
    return this.http.get<EventoCompleto[]>(`${environment.API_URL}/evento/completo`, { params });
  }

  /** Loads one event with the related data used by reference details. */
  getByIdCompleto(id: string): Observable<EventoCompleto> {
    return this.http.get<EventoCompleto>(`${environment.API_URL}/evento/${id}/completo`);
  }
}
