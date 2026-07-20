// credentials-interceptor.spec.ts — gem-docs flavor
// Slice 3 (shared-auth-cross-origin): credentials-interceptor assertions.
//
// Same shape as the gem-web sibling:
// 1. Clones requests targeting `environment.apiBaseUrl` with
//    `withCredentials: true` so the browser attaches the auth cookie on
//    cross-origin HTTP calls to gem-api.
// 2. Foreign URLs pass through with `withCredentials: undefined`.
// 3. Empty apiBaseUrl → no-op pass-through.

import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment as envModule } from '@/environments/environment';
import { credentialsInterceptor } from '@core/interceptors/credentials-interceptor';

describe('credentialsInterceptor (gem-docs — REQ-cross-app-cors Slice 3.2)', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([credentialsInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    envModule.apiBaseUrl = '';
  });

  function withApiBase(value: string) {
    envModule.apiBaseUrl = value;
    envModule.API_URL = value;
  }

  it('clones requests to apiBaseUrl with withCredentials=true', () => {
    withApiBase('https://makima-v2.julitorossian.dev');
    const target = `${envModule.apiBaseUrl}/auth/profile`;

    http.get(target).subscribe();

    const req = httpMock.expectOne(target);
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('passes foreign URLs through untouched', () => {
    withApiBase('https://makima-v2.julitorossian.dev');
    const foreign = 'https://cdn.example.com/assets/logo.png';

    http.get(foreign).subscribe();

    const req = httpMock.expectOne(foreign);
    expect(req.request.withCredentials).toBeFalsy();
    req.flush({});
  });

  it('is a no-op when apiBaseUrl is empty', () => {
    withApiBase('');
    const target = '/auth/profile';

    http.get(target).subscribe();

    const req = httpMock.expectOne(target);
    expect(req.request.withCredentials).toBeFalsy();
    req.flush({});
  });
});
