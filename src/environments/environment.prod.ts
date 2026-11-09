export const environment = {
  production: true,
  // Live host is grafit.net (same values as environment.staging.ts, which the
  // grafit deploy scripts build with). The former Vercel + Cloudways hosting was
  // retired in Nov 2026 — its API host no longer resolves — and is not referenced
  // anywhere anymore.
  apiBaseUrl: 'https://api-webshop.grafit.net', // API + asset URLs
  apiPath: '/api/v1', // for API endpoints
  serverUrl: 'https://webshop.grafit.net', // for server-side rendering
  useDummyAuth: false,
  useMocks: false
};
