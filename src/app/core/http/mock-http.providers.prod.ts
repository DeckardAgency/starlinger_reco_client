import { Provider } from '@angular/core';

/**
 * Deployed builds (`production` / `staging`): replaces `mock-http.providers.ts` via
 * `fileReplacements` in angular.json. There is no mock backend here, and this file must
 * never import anything from `core/mocks`.
 */
export function provideMockHttpInterceptor(): Provider[] {
  return [];
}
