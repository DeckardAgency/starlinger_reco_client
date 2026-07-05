import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '@core/auth/auth.service';
import { AlertService } from '@core/services/alert.service';
import { LoginModalService } from '@services/login-modal.service';
import { LoggerService, ScopedLogger } from '@services/logger.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  private logger!: ScopedLogger;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor(
    private authService: AuthService,
    private router: Router,
    private loginModalService: LoginModalService,
    private loggerService: LoggerService,
    private alertService: AlertService
  ) {
    this.logger = this.loggerService.createLogger('AuthGuard');
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Already authenticated (cached state): run the access checks synchronously.
    if (this.authService.isAuthenticated()) {
      return this.checkAccess(state);
    }

    // SSR has no cookie-backed session, so it can never know who the user is.
    // Do NOT redirect (a 302 to /login rewrites the browser URL before the app
    // boots, losing the deep link and flashing the login page on refresh);
    // render the shell without routed content and let the browser-side guard
    // resolve the session on the preserved URL.
    if (!this.isBrowser) {
      return false;
    }

    // Browser, auth state unknown (page refresh): WAIT for the session check
    // instead of failing the navigation. This removes the login-page flash on
    // refresh and keeps the user on the URL they refreshed (e.g. /checkout)
    // instead of bouncing through the login-modal default return URL.
    return this.authService.checkSession().pipe(
      map(() => {
        if (this.authService.isAuthenticated()) {
          return this.checkAccess(state);
        }

        this.loginModalService.setReturnUrl(state.url);
        setTimeout(() => {
          if (!this.authService.isAuthenticated()) {
            this.loginModalService.open();
          }
        }, 100);
        return this.router.createUrlTree(['/login']);
      })
    );
  }

  /** Access checks for an authenticated user (archived client, client assignment, finance-only). */
  private checkAccess(state: RouterStateSnapshot): boolean | UrlTree {
      // Check if user's client is archived
      if (this.authService.isClientArchived()) {
        this.logger.warn('User\'s client is archived. Logging out...');
        this.authService.logout();
        this.router.navigate(['/']);

        // Show login modal with message (browser only — a pending setTimeout macrotask
        // would delay SSR app stability, and there is no UI to open on the server)
        if (this.isBrowser) {
          setTimeout(() => {
            this.loginModalService.open();
          }, 100);
        }

        return false;
      }

      // Customer routes require a client assignment
      const isCustomerRoute = state.url.startsWith('/customer');
      if (isCustomerRoute && !this.authService.hasClient()) {
        this.logger.warn('User has no client assigned. Redirecting to no-client page.');
        this.router.navigate(['/no-client']);
        return false;
      }

      // Finance users are notification-only: they can sign in but cannot use the webshop.
      // Treat them as "no access" for any /customer/* route.
      if (isCustomerRoute && this.isFinanceOnly()) {
        this.logger.warn('Finance user has no webshop access. Logging out.');
        this.authService.logout();
        this.router.navigate(['/']);
        // Browser only: setTimeout stalls SSR stability and there is no UI on the server
        if (this.isBrowser) {
          setTimeout(() => {
            this.loginModalService.open();
            this.alertService.warning(
              'This account is for order notifications only and does not have webshop access.',
              'No webshop access'
            );
          }, 200);
        }
        return false;
      }

      return true;
  }

  private isFinanceOnly(): boolean {
    return this.authService.hasRole('ROLE_FINANCE')
      && !this.authService.hasRole('ROLE_CLIENT')
      && !this.authService.hasRole('ROLE_CLIENT_ADMIN')
      && !this.authService.hasRole('ROLE_ADMIN');
  }
}
