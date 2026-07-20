// environment.ts — base/default production-shaped bundle (test/prod placeholder).
//
// Slice 3 (shared-auth-cross-origin): gem-docs needs the same env-driven
// secret surface as gem-web for the cookie-aware boot probe, the
// BroadcastChannel listener, and the credentials-interceptor. Production
// builds use this file directly; development replaces it via angular.json
// `fileReplacements` with `environment.development.ts`. Both files declare
// the same shape so TypeScript structural typing stays clean.

export const environment = {
  production: false,

  // Base URL of the gem-api backend (HTTPS for test/prod placeholder +
  // localhost for dev). Consumed by HttpClient calls via cookie/bearer.
  API_URL: 'https://makima-v2.julitorossian.dev',

  // Base URL of gem-web (origin the user lands on when no cookie is set
  // and the boot probe comes back 401). Boot.auth-boot.spec.ts uses this
  // to construct the redirect target.
  GEM_WEB_URL: 'https://gem-web.julitorossian.dev',

  // Cross-app shared auth fields (added in Slice 3).
  loginUrl: 'https://gem-web.julitorossian.dev/auth/sign-in',
  apiBaseUrl: 'https://makima-v2.julitorossian.dev', // alias of API_URL
  cookieName: 'token',
  cookieOnlyAuth: false, // future flag (Slice 4); wired so literal is reserved
  useCookieAuth: true, // test/prod: cookie is the credential
  trustedReturnOrigins: [
    'https://gem-docs.julitorossian.dev',
    'https://gem-web.julitorossian.dev',
  ] as string[],
};
