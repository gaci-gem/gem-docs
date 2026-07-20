// environment.development.ts — local dev (http://localhost).
//
// Slice 3 (shared-auth-cross-origin): dev has cookies off (`useCookieAuth`
// = false) so the boot probe still hits 401 and redirects the user to
// gem-web/login — the URL-token handover on `?token=…` is the dev-only
// bypass (Q4 LOCKED). The trustedReturnOrigins allowlist is intentionally
// dev-host-only; spec mismatch against the test/prod firth protects
// against widening the surface without review.

export const environment = {
  production: true,

  API_URL: 'http://localhost:4000',
  GEM_WEB_URL: 'http://localhost:4200',

  loginUrl: 'http://localhost:4200/auth/sign-in',
  apiBaseUrl: 'http://localhost:4000',
  cookieName: 'token',
  cookieOnlyAuth: false,
  useCookieAuth: false,
  trustedReturnOrigins: [
    'http://localhost:4201', // gem-docs companion origin
    'http://localhost:4200', // gem-web origin
  ] as string[],
};
