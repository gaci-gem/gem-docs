import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@/environments/environment';
import { FiltroActivo } from '@/app/constants/filtros_activo';
import { UsuarioService } from './usuario';

describe('UsuarioService', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UsuarioService, provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('can load inactive users needed by historical references', () => {
    TestBed.inject(UsuarioService).getAll(FiltroActivo.ALL).subscribe();

    const request = http.expectOne(`${environment.API_URL}/usuario?activo=all`);
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });
});
