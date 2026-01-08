import { ApplicationConfig, provideZoneChangeDetection, Provider } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AuthInterceptor } from '@core/auth/auth.interceptor';
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
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(
      withFetch(),
      withInterceptorsFromDi()
    ),
    ...getHttpInterceptorProviders()
  ]
};
