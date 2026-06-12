import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '@/environments/environment';

/**
 * Reads ?token= from URL (passed by gem-web after login) and saves to localStorage.
 * This is needed because localStorage is origin-specific and gem-docs (port 4201)
 * cannot read tokens stored by gem-web (port 4200).
 */
function extractAndSaveTokenFromUrl(): boolean {
  const url = new URL(window.location.href);
  const token = url.searchParams.get('token');
  if (token) {
    const storage = localStorage.getItem('access_token') ? localStorage : sessionStorage;
    storage.setItem('access_token', token);
    // Clean URL without reloading (remove token from browser history)
    url.searchParams.delete('token');
    const cleanUrl = url.toString();
    window.history.replaceState({}, '', cleanUrl);
    return true;
  }
  return false;
}

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if token was passed via URL (from gem-web redirect after login)
  const hadTokenInUrl = extractAndSaveTokenFromUrl();

  return authService.verifyToken().pipe(
    map((isValid) => {
      if (isValid) {
        return true;
      }
      // No token — redirect to gem-web login with returnUrl pointing back to gem-docs
      const gemWebLogin = `${environment.GEM_WEB_URL}/login`;
      const returnUrl = encodeURIComponent(window.location.origin + state.url);
      const redirectTo = `${gemWebLogin}?returnUrl=${returnUrl}`;
      window.location.href = redirectTo;
      return false;
    }),
    catchError(() => {
      const gemWebLogin = `${environment.GEM_WEB_URL}/login`;
      const returnUrl = encodeURIComponent(window.location.origin + state.url);
      const redirectTo = `${gemWebLogin}?returnUrl=${returnUrl}`;
      window.location.href = redirectTo;
      return of(false);
    })
  );
};