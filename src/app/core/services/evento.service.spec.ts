import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EventoService } from './evento.service';
import { environment } from '../../../environments/environment';
import { FiltroActivo } from '../../constants/filtros_activo';

describe('EventoService', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EventoService, provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads events from the gem-api event endpoint', () => {
    const events = [{ id: 'event-1', titulo: 'Actualizar backend' }];
    TestBed.inject(EventoService).list().subscribe((result) => expect(result).toEqual(events));

    const request = http.expectOne(`${environment.API_URL}/evento`);
    expect(request.request.method).toBe('GET');
    request.flush(events);
  });

  it('can request closed and open events together', () => {
    TestBed.inject(EventoService).list({ cerrado: FiltroActivo.ALL }).subscribe();

    const request = http.expectOne(`${environment.API_URL}/evento?cerrado=all`);
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('loads complete events with their event type color', () => {
    const events = [{ id: 'event-1', tipo: { color: '#2563eb' } }];
    TestBed.inject(EventoService).listComplete({ cerrado: FiltroActivo.ALL }).subscribe((result) => expect(result).toEqual(events));

    const request = http.expectOne(`${environment.API_URL}/evento/completo?cerrado=all`);
    expect(request.request.method).toBe('GET');
    request.flush(events);
  });

  it('loads one complete event by id', () => {
    const event = { id: 'event-1', tipoCodigo: 'BUG', numero: 7, titulo: 'Detalle' };
    TestBed.inject(EventoService).getByIdCompleto('event-1').subscribe((result) => expect(result).toEqual(event));

    const request = http.expectOne(`${environment.API_URL}/evento/event-1/completo`);
    expect(request.request.method).toBe('GET');
    request.flush(event);
  });
});
