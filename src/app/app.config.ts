import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection, Provider } from '@angular/core';
import { provideRouter, withPreloading, NoPreloading } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideClientHydration, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AuthInterceptor } from '@core/auth/auth.interceptor';
import { IdleTimeoutService } from '@core/auth/idle-timeout.service';
import { ForClientInterceptor } from '@core/interceptors/for-client.interceptor';
import { provideMockHttpInterceptor } from '@core/http/mock-http.providers';

// Build providers array based on environment
function getHttpInterceptorProviders(): Provider[] {
  // Mock interceptor (must be BEFORE the auth interceptor to intercept first). Only ever
  // present in local development: deployed builds swap the provider file for an empty
  // one (see mock-http.providers.ts), so no mock code ships to production.
  const providers: Provider[] = [...provideMockHttpInterceptor()];

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
    ...getHttpInterceptorProviders(),
    // Automatic logout after inactivity: instantiate the watcher at startup (it only
    // runs in the browser and only while a user is signed in).
    provideAppInitializer(() => { inject(IdleTimeoutService); })
  ]
};
