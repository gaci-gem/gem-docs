import { environment } from '@/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, tap, map, catchError, BehaviorSubject } from 'rxjs';
import { Usuario } from '@core/interfaces';
import { UserStorageService, UsuarioLogeado } from './user-storage';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private userStorage = inject(UserStorageService);

  // Keys shared with gem-web (same localStorage keys)
  private readonly accessTokenKey = 'access_token';
  private readonly refreshTokenKey = 'refresh_token';

  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey) ?? sessionStorage.getItem(this.accessTokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey) ?? sessionStorage.getItem(this.refreshTokenKey);
  }

  clearTokens(): void {
    // Tokens belong to gem-web — only clear user data in gem-docs
    this.currentUserSubject.next(null);
    this.userStorage.clearUsuario();
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  verifyToken(): Observable<boolean> {
    const token = this.getAccessToken();
    if (!token) return of(false);

    // Try to restore user from storage first (same user data key as gem-web)
    const storedUser = this.userStorage.getUsuario();
    if (storedUser) {
      this.currentUserSubject.next(storedUser as unknown as Usuario);
      return of(true);
    }

    // Make HTTP call with X-Verify-Only header so interceptor knows NOT to try refresh on 401
    return this.http.get<any>(`${environment.API_URL}/auth/profile`, {
      headers: { 'X-Verify-Only': 'true' }
    }).pipe(
      tap(res => {
        const user = res.usuario ?? res;
        this.currentUserSubject.next(user);
        this.userStorage.setUsuario(user as unknown as UsuarioLogeado, false);
      }),
      map(() => true),
      catchError(err => {
        // Throw so guard's catchError can redirect with returnUrl
        throw { isVerifyError: true, status: err.status };
      })
    );
  }

  logout(): void {
    // Clear only gem-docs local user data — tokens stay for gem-web
    this.clearTokens();
  }

  /**
   * Slice 3 (shared-auth-cross-origin) — broadcast hydration. Called by
   * `AuthBoot.run()` on a 200 response from `GET /auth/profile`. Pushes the
   * freshly decoded user into the BehaviorSubject so any subscribers (e.g.,
   * the topbar) re-render with the correct name/avatar.
   */
  hydrateUser(usuario: Usuario): void {
    this.currentUserSubject.next(usuario);
  }

  /**
   * Slice 3 (shared-auth-cross-origin) — remote logout hook. Called by
   * `AuthLogoutListener.onRemoteLogout()` after a `gem-auth` BroadcastChannel
   * message is received from gem-web. The cookie is already cleared
   * server-side (it was gem-web's POST), so we only reset the in-memory
   * user subject; LS clear happens upstream in the listener.
   */
  notifyRemoteLogout(): void {
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): Observable<Usuario | null> {
    return this.currentUserSubject.asObservable();
  }

  getCurrentUserValue(): Usuario | null {
    return this.currentUserSubject.getValue();
  }

  refreshToken(): Observable<{ accessToken: string; refreshToken: string }> {
    const refresh = this.getRefreshToken();
    return this.http.post<{ accessToken: string; refreshToken: string }>(
      `${environment.API_URL}/auth/refresh`,
      { refreshToken: refresh }
    );
  }

  login(credentials: { email: string; password: string }, rememberMe = false): Observable<{ accessToken: string; refreshToken: string; usuario: Usuario }> {
    return this.http.post<{ accessToken: string; refreshToken: string; usuario: Usuario }>(
      `${environment.API_URL}/auth/login`,
      credentials
    ).pipe(
      tap(res => {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem(this.accessTokenKey, res.accessToken);
        storage.setItem(this.refreshTokenKey, res.refreshToken);
        this.currentUserSubject.next(res.usuario);
        this.userStorage.setUsuario(res.usuario as unknown as UsuarioLogeado, rememberMe);
      })
    );
  }
}