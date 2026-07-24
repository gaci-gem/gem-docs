// boot.ts
// Slice 3 (shared-auth-cross-origin): AuthBoot — gem-docs producer-side
// cookie-aware boot probe. Wired via `provideAppInitializer` in
// `app.config.ts` so it runs ONCE before the first route activates.
//
// Design drift from design.md § 8 — we split decision from side-effect:
//   `run()` returns a `BootResult` describing the action to take. The
//   side-effect (window.location.href assignment, hydration, etc.) lives
//   in the AppInitializer wired in `app.config.ts`. This makes the boot
//   probe fully unit-testable under Vitest+jsdom (no need to stub
//   window.location.href which is read-only for cross-origin writes).
//
// Flow
//   1. Dev bypass (\`useCookieAuth=false\`): if the URL carries \`?token=...\`,
//      consume it (store in sessionStorage), strip via \`history.replaceState\`,
//      and return \`{ kind: 'hydrate' }\`. No HTTP probe, no redirect.
//   2. Boot probe (\`useCookieAuth=true\` or dev with no token): single
//      \`GET /auth/profile\` with \`withCredentials: true\`.
//      - 200 → hydrate \`UserStorageService\`; return \`{ kind: 'hydrate' }\`.
//      - 401 → return \`{ kind: 'redirect', url: \${loginUrl}?returnUrl=…\`,
//        which the AppInitializer commits to window.location.href.
//
// Q2 (gem-docs auto-redirect) is LOCKED in Engram 342 — this is the
// concrete implementation.

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthService } from '@core/services/auth';
import { UserStorageService, UsuarioLogeado } from '@core/services/user-storage';
import { Usuario } from '@core/interfaces';
import { environment } from '@/environments/environment';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

const STORAGE_KEY_ACCESS = 'access_token';

export type BootResult =
  | { kind: 'hydrate' }
  | { kind: 'redirect' };

/**
 * Returns an Observable when the boot probe needs to block route activation
 * (cookie auth), or a sync BootResult for the dev bypass path. The caller
 * (`provideAppInitializer` in app.config.ts) awaits the Observable before
 * route evaluation, ensuring the auth guard never fires before the probe
 * completes.
 */
export type BootRunResult = Observable<BootResult> | BootResult;

@Injectable({ providedIn: 'root' })
export class AuthBoot {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private userStorage = inject(UserStorageService);

  /**
   * Run the boot probe. Returns:
   * - `Observable<BootResult>` when an HTTP probe is needed (cookie auth).
   *   The caller awaits it so route activation blocks until the probe
   *   completes.
   * - `BootResult` for the sync dev bypass (token-in-URL).
   */
  run(): BootRunResult {
    // Dev bypass: capture ?token= from URL. No HTTP probe, no redirect.
    if (this.consumeTokenFromUrl()) {
      return { kind: 'hydrate' };
    }

    const profileUrl = `${environment.API_URL}/auth/profile`;
    return this.http.get<any>(profileUrl, {
      withCredentials: true,
      headers: { 'X-Verify-Only': 'true' },
    }).pipe(
      map((res) => {
        const user = res.usuario ?? res;
        this.userStorage.setUsuario(user as unknown as UsuarioLogeado, false);
        this.authService.hydrateUser(user);
        return { kind: 'hydrate' as const };
      }),
      catchError((err) => {
        if (err?.status === 401) {
          const url = this.buildRedirectUrl();
          this.commitRedirect(url);
        }
        // Return a completing observable — redirect already fired via
        // commitRedirect / window.location.href, so Angular will never
        // activate the blocked route.
        return of({ kind: 'redirect' as const });
      }),
    );
  }

  /**
   * Pure URL builder for the gem-web/login redirect. Public so it can be
   * unit-tested without needing to stub window.location.href assignment.
   */
  buildRedirectUrl(): string {
    const loginUrl = environment.loginUrl ?? environment.GEM_WEB_URL;
    const returnUrl = encodeURIComponent(window.location.href);
    return `${loginUrl}?returnUrl=${returnUrl}`;
  }

  /**
   * Side-effect: assign the redirect URL to window.location.href.
   * Pure builder above; this is what's called from the 401 path.
   */
  commitRedirect(url: string): void {
    window.location.href = url;
  }

  /**
   * Read \`?token=queryString\` from window.location, store the JWT into
   * sessionStorage (mirroring gem-web's LS-first / SS-fallback pattern),
   * strip the query parameter via history.replaceState.
   * Returns true if the token was consumed.
   */
  private consumeTokenFromUrl(): boolean {
    if (typeof window === 'undefined' || !window.history) {
      return false;
    }
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    if (!token) {
      return false;
    }
    const storage = localStorage.getItem(STORAGE_KEY_ACCESS) ? localStorage : sessionStorage;
    storage.setItem(STORAGE_KEY_ACCESS, token);
    url.searchParams.delete('token');
    window.history.replaceState({}, '', url.toString());
    return true;
  }
}
