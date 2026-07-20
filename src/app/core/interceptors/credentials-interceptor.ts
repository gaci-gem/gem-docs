// credentials-interceptor.ts
//
// Slice 3 (shared-auth-cross-origin): same shape as the gem-web sibling
// (`@core/interceptors/credentials-interceptor` in gem-web). Clones requests
// targeting `environment.apiBaseUrl` with `withCredentials: true` so the
// browser attaches the auth cookie on cross-origin HTTP calls to gem-api.
//
// Differences from gem-web
// - Uses `environment.API_URL` / `environment.apiBaseUrl` keys (gem-docs
//   historically speaks `API_URL`; Slice 3 added `apiBaseUrl` as an alias).
// - Empty apiBaseUrl → no-op pass-through (same invariant).
// - Lives at `src/app/core/interceptors/` next to `auth-interceptor.ts` and
//   `loading-interceptor.ts`.

import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '@/environments/environment';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  // apiBaseUrl is the alias surface; fall back to API_URL for back-compat
  // with code-paths that haven't migrated to the new key.
  const apiBase = environment.apiBaseUrl || environment.API_URL;
  if (!apiBase || !req.url || !req.url.startsWith(apiBase)) {
    return next(req);
  }
  return next(req.clone({ withCredentials: true }));
};
