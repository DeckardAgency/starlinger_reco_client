import { Injectable, Provider } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { environment } from '@env/environment';

/**
 * DEVELOPMENT-ONLY wiring for the mock backend (`environment.useMocks`).
 *
 * This file is swapped for `mock-http.providers.prod.ts` (an empty provider list) by
 * `fileReplacements` in angular.json for the `production` and `staging` configurations,
 * so neither it nor anything under `core/mocks` ends up in a deployed bundle.
 *
 * Even here the mocks are only reached through a dynamic import: nothing in the app
 * imports `core/mocks` statically.
 */
@Injectable()
class LazyMockInterceptor implements HttpInterceptor {
  private delegate: Promise<HttpInterceptor> | null = null;

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    this.delegate ??= import('../mocks/mock.interceptor').then(m => new m.MockInterceptor());
    return from(this.delegate).pipe(switchMap(mock => mock.intercept(request, next)));
  }
}

/** Mock interceptor provider when `environment.useMocks` is on, otherwise nothing. */
export function provideMockHttpInterceptor(): Provider[] {
  if (!environment.useMocks) {
    return [];
  }
  console.log('🔧 Mock interceptor enabled - using mock data');
  return [{ provide: HTTP_INTERCEPTORS, useClass: LazyMockInterceptor, multi: true }];
}
