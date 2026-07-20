// gem-docs/src/app/views/auth/auth-boot.spec.ts
// Slice 3 (shared-auth-cross-origin): strict-TDD spec for AuthBoot + BC
// logout listener.
//
// Covers the REQ-cookie-aware-boot (Slice 3.5), REQ-logout-all-envs
// (Slice 3.4), and the gem-docs producer-side credentials shape (no spec
// asserted here; see credentials-interceptor.spec.ts).
//
// S1 — env=test (useCookieAuth=true), no cookie in storage probe, 401 -> build
//      redirect URL containing loginUrl + encoded returnUrl; commitRedirect
//      fires.
// S2 — env=test, cookie present (sanity), probe gets 200, hydrate
//      user state, NO redirect.
// S3 — env=dev (useCookieAuth=false), `?token=` in URL -> token consumed
//      into sessionStorage, URL stripped via history.replaceState, NO
//      HTTP probe, NO redirect.
// S4 — env=dev, no `?token=`, no cookie -> probe 401 -> commitRedirect
//      fires with the dev-flavoured login URL.
// L1 — BC logout message clears LS+SS tokens + user state.
// L2 — non-logout BC messages are ignored.

import { TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { AuthBoot } from '@core/auth/boot';
import { AuthLogoutListener } from '@core/auth/listen-logout';
import { AuthService } from '@core/services/auth';
import { UserStorageService } from '@core/services/user-storage';
import { environment as envModule } from '@/environments/environment';

// ---------------------------------------------------------------------------
// localStorage / sessionStorage polyfills. The gem-docs Vitest+@angular/build
// configuration does NOT initialize these globals; we install Map-backed
// stores here once per spec file.
// ---------------------------------------------------------------------------
const buildMemoryStore = () => {
  const store = new Map<string, string>();
  return {
    getItem: (k: string): string | null => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string): void => {
      store.set(k, v);
    },
    removeItem: (k: string): void => {
      store.delete(k);
    },
    clear: (): void => {
      store.clear();
    },
    key: (i: number): string | null => Array.from(store.keys())[i] ?? null,
    get length(): number {
      return store.size;
    },
  };
};
const ensureGlobal = (key: 'localStorage' | 'sessionStorage') => {
  if (typeof (globalThis as unknown as Record<string, unknown>)[key] === 'undefined') {
    Object.defineProperty(globalThis, key, {
      value: buildMemoryStore(),
      configurable: true,
      writable: true,
    });
  }
};
ensureGlobal('localStorage');
ensureGlobal('sessionStorage');

// Patch jsdom's history.replaceState — it throws "Not implemented" unless
// the URL change is a hash change. AuthBoot uses replaceState to strip
// `?token=` from the address bar, which is a real URL change.
if (typeof window !== 'undefined' && typeof window.history !== 'undefined') {
  const originalReplace = window.history.replaceState.bind(window.history);
  window.history.replaceState = ((..._args: unknown[]) => {
    try {
      originalReplace(...(_args as Parameters<typeof originalReplace>));
    } catch {
      // jsdom stub; swallowed — the production browser honors real URL changes.
    }
    return undefined as unknown as void;
  }) as typeof window.history.replaceState;
}

function configure(partial: Partial<typeof envModule>) {
  Object.assign(envModule, partial);
}
function resetEnv() {
  configure({
    production: false,
    API_URL: 'https://makima-v2.julitorossian.dev',
    GEM_WEB_URL: 'https://gem-web.julitorossian.dev',
    loginUrl: 'https://gem-web.julitorossian.dev/auth/sign-in',
    apiBaseUrl: 'https://makima-v2.julitorossian.dev',
    cookieName: 'token',
    useCookieAuth: false,
    cookieOnlyAuth: false,
    trustedReturnOrigins: [],
  });
}

describe('AuthBoot + AuthLogoutListener — REQ-cookie-aware-boot + REQ-logout-all-envs', () => {
  let httpMock: HttpTestingController;
  let boot: AuthBoot;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        UserStorageService,
        AuthBoot,
      ],
    });

    boot = TestBed.inject(AuthBoot);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    sessionStorage.clear();
    resetEnv();
  });

  it('S1: test env + no cookie + 401 -> commitRedirect with login URL + encoded returnUrl', () => {
    configure({ useCookieAuth: true, loginUrl: 'https://gem-web.julitorossian.dev/auth/sign-in' });
    const commit = vi.spyOn(boot, 'commitRedirect');

    boot.run();

    const req = httpMock.expectOne(`${envModule.API_URL}/auth/profile`);
    expect(req.request.withCredentials).toBe(true);
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(commit).toHaveBeenCalledTimes(1);
    const redirectUrl = commit.mock.calls[0][0];
    expect(redirectUrl).toContain('https://gem-web.julitorossian.dev/auth/sign-in?returnUrl=');
    expect(redirectUrl).toContain(encodeURIComponent(window.location.href));
    expect(redirectUrl).not.toContain('token=');
  });

  it('S2: test env + probe 200 hydrates the user and does NOT trigger redirect', () => {
    configure({ useCookieAuth: true });
    const commit = vi.spyOn(boot, 'commitRedirect');

    boot.run();

    const req = httpMock.expectOne(`${envModule.API_URL}/auth/profile`);
    expect(req.request.withCredentials).toBe(true);
    req.flush({ usuario: { id: 'user-1', nombre: 'Test', apellido: 'User' } });

    const userStorage = TestBed.inject(UserStorageService);
    const stored = userStorage.getUsuario();
    expect(stored).toBeTruthy();
    expect(stored?.id).toBe('user-1');

    expect(commit).not.toHaveBeenCalled();
  });

  it('S3: dev env + ?token= consumes URL token into sessionStorage, strips URL, no probe', () => {
    configure({ useCookieAuth: false });
    window.history.replaceState(null, '', '/?token=jwt.test.url.token');
    const commit = vi.spyOn(boot, 'commitRedirect');

    boot.run();

    // No HTTP probe is fired — the URL-token handover preempts the probe.
    httpMock.expectNone(() => true);

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(sessionStorage.getItem('access_token')).toBe('jwt.test.url.token');

    expect(commit).not.toHaveBeenCalled();
  });

  it('S4: dev env without ?token= and no cookie -> probe 401 -> commitRedirect', () => {
    configure({
      useCookieAuth: false,
      loginUrl: 'https://gem-web.julitorossian.dev/auth/sign-in',
    });
    const commit = vi.spyOn(boot, 'commitRedirect');

    boot.run();

    const req = httpMock.expectOne(`${envModule.API_URL}/auth/profile`);
    expect(req.request.withCredentials).toBe(true);
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(commit).toHaveBeenCalledTimes(1);
    const redirectUrl = commit.mock.calls[0][0];
    expect(redirectUrl).toContain('https://gem-web.julitorossian.dev/auth/sign-in?returnUrl=');
    expect(redirectUrl).not.toContain('token=');
  });

  // -- AuthLogoutListener (REQ-logout-all-envs — Slice 3.4) -----------------

  it('L1: BroadcastChannel "logout" message clears LS+SS tokens + user state', async () => {
    const userStorage = TestBed.inject(UserStorageService);
    TestBed.inject(AuthLogoutListener); // construct so the listener subscribes

    // Pre-populate a "live session".
    localStorage.setItem('access_token', 'jwt.live.session');
    localStorage.setItem('refresh_token', 'jwt.live.refresh');
    sessionStorage.setItem('access_token', 'jwt.live.session');
    userStorage.setUsuario(
      { id: 'u-1', nombre: 'Live', apellido: 'User', email: 'live@test' },
      true,
    );

    const sender = new BroadcastChannel('gem-auth');
    sender.postMessage({ type: 'logout', at: new Date().toISOString() });
    sender.close();

    await new Promise<void>((resolve) => {
      if (
        localStorage.getItem('access_token') === null &&
        sessionStorage.getItem('access_token') === null &&
        !userStorage.getUsuario()
      ) {
        return resolve();
      }
      const deadline = Date.now() + 1000;
      const interval = setInterval(() => {
        const cleared =
          localStorage.getItem('access_token') === null &&
          localStorage.getItem('refresh_token') === null &&
          !userStorage.getUsuario();
        if (cleared || Date.now() > deadline) {
          clearInterval(interval);
          resolve();
        }
      }, 5);
    });

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(sessionStorage.getItem('access_token')).toBeNull();
    expect(userStorage.getUsuario()).toBeNull();
  });

  it('L2: ignores non-logout messages on the channel', async () => {
    const userStorage = TestBed.inject(UserStorageService);
    TestBed.inject(AuthLogoutListener);

    localStorage.setItem('access_token', 'jwt.keep.me');
    userStorage.setUsuario(
      { id: 'u-2', nombre: 'Stay', apellido: 'Put', email: 'stay@test' },
      true,
    );

    const sender = new BroadcastChannel('gem-auth');
    sender.postMessage({ type: 'heartbeat', at: new Date().toISOString() });
    sender.close();

    await new Promise<void>((resolve) => setTimeout(resolve, 50));

    expect(localStorage.getItem('access_token')).toBe('jwt.keep.me');
    expect(userStorage.getUsuario()?.id).toBe('u-2');
  });
});
