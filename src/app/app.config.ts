import { ApplicationConfig, provideZoneChangeDetection, Provider } from '@angular/core';
import { provideRouter, withPreloading, NoPreloading } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideClientHydration, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AuthInterceptor } from '@core/auth/auth.interceptor';
import { ForClientInterceptor } from '@core/interceptors/for-client.interceptor';
import { MockInterceptor } from '@core/mocks/mock.interceptor';
import { environment } from '../environments/environment';

// Build providers array based on environment
function getHttpInterceptorProviders(): Provider[] {
  const providers: Provider[] = [];

  // Add mock interceptor if enabled (must be BEFORE auth interceptor to intercept first)
  if (environment.useMocks) {
    providers.push({
      provide: HTTP_INTERCEPTORS,
      useClass: MockInterceptor,
      multi: true
    });
    console.log('🔧 Mock interceptor enabled - using mock data');
  }

  // Client agents: tag product reads with the selected managed client (forClient=<id>)
  // so the shop is priced for that client. Before the auth interceptor, so a request it
  // replays after a token refresh already carries the param.
  providers.push({
    provide: HTTP_INTERCEPTORS,
    useClass: ForClientInterceptor,
    multi: true
  });

  // Always add auth interceptor
  providers.push({
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true
  });

  return providers;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withPreloading(NoPreloading)),
    // Hydration WITHOUT withEventReplay(): the CSP in server.ts is a strict
    // `script-src 'self'` with no nonce mechanism, and event replay injects an inline
    // event-recording script that would be blocked. The hydration state itself is a
    // non-executable <script type="application/json"> block and is CSP-safe.
    provideClientHydration(withHttpTransferCacheOptions({ includePostRequests: false })),
    provideAnimationsAsync(),
    provideHttpClient(
      withFetch(),
      withInterceptorsFromDi()
    ),
    ...getHttpInterceptorProviders()
  ]
};
