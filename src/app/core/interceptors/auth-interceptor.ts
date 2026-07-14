import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '@/environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getAccessToken();

  const redirectToGemWebLogin = () => {
    // Preserve current gem-docs URL as returnUrl so user comes back here after login
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `${environment.GEM_WEB_URL}/login?returnUrl=${returnUrl}`;
  };

  if (req.headers.get('X-Refresh-Attempt')) {
    authService.logout();
    redirectToGemWebLogin();
    return throwError(() => new Error('Refresh token expired'));
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authReq).pipe(
    catchError((error: any) => {
      // If verifyToken() made this request (has X-Verify-Only header) and got 401,
      // let guard handle the redirect with returnUrl — don't try refresh
      if (req.headers.has('X-Verify-Only') && error.status === 401) {
        return throwError(() => error);
      }

      if (error.status === 401) {
        if (req.url.includes('/auth/refresh')) {
          authService.logout();
          redirectToGemWebLogin();
          return throwError(() => error);
        }

        return authService.refreshToken().pipe(
          switchMap((newToken: { accessToken: string; refreshToken: string }) => {
            // Store new tokens (same keys as gem-web uses)
            if (newToken.accessToken) {
              const storage = localStorage.getItem('access_token') ? localStorage : sessionStorage;
              storage.setItem('access_token', newToken.accessToken);
              if (newToken.refreshToken) {
                storage.setItem('refresh_token', newToken.refreshToken);
              }
            }

            const newAuthReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken.accessToken}`
              }
            });

            return next(newAuthReq);
          }),
          catchError(refreshError => {
            authService.logout();
            redirectToGemWebLogin();
            return throwError(() => refreshError);
          })
        );
      }

      return throwError(() => error);
    })
  );
};