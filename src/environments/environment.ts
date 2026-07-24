// environment.ts — base/default production-shaped bundle (test/prod placeholder).
//
// Slice 3 (shared-auth-cross-origin): gem-docs needs the same env-driven
// secret surface as gem-web for the cookie-aware boot probe, the
// BroadcastChannel listener, and the credentials-interceptor. Production
// builds use this file directly; development replaces it via angular.json
// `fileReplacements` with `environment.development.ts`. Both files declare
// the same shape so TypeScript structural typing stays clean.

export const environment = {
  production: true,

  // Replaced at container startup by entrypoint.sh via environment variables
  API_URL: '__API_URL__',
  GEM_WEB_URL: '__GEM_WEB_URL__',

  // Cross-app shared auth fields using placeholders
  loginUrl: '__GEM_WEB_URL__/login',
  apiBaseUrl: '__API_URL__', // alias of API_URL
  cookieName: 'token',
  cookieOnlyAuth: true, // test/prod: cookies are mandatory for SSO
  useCookieAuth: true, // test/prod: cookie is the credential
  trustedReturnOrigins: [
    '__GEM_WEB_URL__',
  ] as string[],
};
