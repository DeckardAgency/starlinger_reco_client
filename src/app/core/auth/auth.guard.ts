import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
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
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('AuthGuard');
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // First check if user is already authenticated
    if (this.authService.isAuthenticated()) {
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
        // Browser only: setTimeout stalls SSR stability and alert() does not exist on the server
        if (this.isBrowser) {
          setTimeout(() => {
            this.loginModalService.open();
            alert('This account is for order notifications only and does not have webshop access.');
          }, 200);
        }
        return false;
      }

      return true;
    }

    // Store the attempted URL for redirecting after login
    const returnUrl = state.url;
    this.loginModalService.setReturnUrl(returnUrl);

    // On the server there is no login modal to open, and the 100ms setTimeout macrotask
    // would delay app stability (~100-200ms extra TTFB per guarded SSR request).
    // Redirect to /login so guarded deep links SSR a real page instead of an empty shell;
    // the browser re-runs the guard on boot and keeps its modal behavior.
    if (!this.isBrowser) {
      return this.router.createUrlTree(['/login']);
    }

    // Delay opening the modal slightly to avoid showing it during page refresh
    // when authentication might still be in progress
    setTimeout(() => {
      if (!this.authService.isAuthenticated()) {
        this.loginModalService.open();
      }
    }, 100);

    // Return false to prevent navigation when not authenticated
    return false;
  }

  private isFinanceOnly(): boolean {
    return this.authService.hasRole('ROLE_FINANCE')
      && !this.authService.hasRole('ROLE_CLIENT')
      && !this.authService.hasRole('ROLE_CLIENT_ADMIN')
      && !this.authService.hasRole('ROLE_ADMIN');
  }
}
