import { Component, inject, DestroyRef, PLATFORM_ID, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { TopBarComponent } from './layout/topbar/top-bar.component';
import { NgIf, isPlatformBrowser } from '@angular/common';
import { EMPTY } from 'rxjs';
import { filter, startWith, exhaustMap, catchError } from 'rxjs/operators';
import { SidebarService } from '@services/sidebar.service';
import { LoginModalService } from '@services/login-modal.service';
import { LoginModalComponent } from '@shared/components/modals/login-modal/login-modal.component';
import { AuthService } from '@core/auth/auth.service';
import { CartService } from '@core/services/cart.service';
import { WishlistService } from '@core/services/wishlist.service';
import { MobileMenuComponent } from './layout/mobile-menu/mobile-menu.component';
import { CartComponent } from '@features/customer/shop/cart/cart.component';
import { WishlistComponent } from '@features/customer/shop/wishlist/wishlist.component';
import { AlertComponent } from '@shared/components/alert/alert.component';
import { LoggerService, ScopedLogger } from '@services/logger.service';
import { environment } from '@env/environment';

@Component({
    selector: 'app-root',
    imports: [
      RouterOutlet,
      SidebarComponent,
      TopBarComponent,
      NgIf,
      LoginModalComponent,
      MobileMenuComponent,
      CartComponent,
      WishlistComponent,
      AlertComponent
    ],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  title = 'starlinger_reco_client';
  currentRoute: string = '';
  isAuthenticated: boolean = false;
  isAuthPage: boolean = false;
  is404Page: boolean = false;
  loginModalOpen: boolean = false;

  private readonly authRoutes = ['/login', '/forgot-password', '/register', '/no-client'];

  /** Re-check the client's archived status at most once per TTL per session. */
  private static readonly CLIENT_STATUS_TTL_MS = 5 * 60 * 1000;
  private lastClientStatusCheckAt = 0;

  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private logger!: ScopedLogger;

  constructor(
    public sidebarService: SidebarService,
    private router: Router,
    public loginModalService: LoginModalService,
    private authService: AuthService,
    public cartService: CartService,
    public wishlistService: WishlistService,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('AppComponent');

    // Subscribe to router events to keep track of current route
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((event: NavigationEnd) => {
      // urlAfterRedirects: arriving at /login via a redirect ('' -> '/login')
      // leaves event.url at the pre-redirect value, which showed the app shell
      // (sidebar/topbar) on the login page.
      const url = event.urlAfterRedirects;
      this.currentRoute = url;
      this.isAuthPage = this.authRoutes.some(route => url.startsWith(route));
      this.is404Page = url === '/404' || url.startsWith('/404?');
      this.cdr.markForCheck();
    });

    // Re-validate the client's archived status: ONE long-lived pipeline, triggered at
    // bootstrap (startWith) and on navigation, rate-limited to one fetch per TTL, and
    // using exhaustMap so a pending fetch can never stack with another.
    // Reuses AuthService.checkSession() (/api/me, which includes client.isArchived) —
    // at boot this shares the single in-flight request of the startup session validation
    // instead of fetching the same payload a second time via getUserByEmail.
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null),
      filter(() => this.shouldCheckClientStatus()),
      exhaustMap(() => {
        const email = this.authService.getCurrentUser()?.email;
        if (!email) {
          return EMPTY;
        }
        return this.authService.checkSession().pipe(
          catchError(error => {
            this.logger.error('Error checking client status:', error);
            return EMPTY;
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(userData => {
      if (userData?.client?.isArchived) {
        this.handleArchivedClient();
      }
    });

    // Initialize current route
    this.currentRoute = this.router.url;
    this.isAuthPage = this.authRoutes.some(route => this.router.url.startsWith(route));
    this.is404Page = this.router.url === '/404' || this.router.url.startsWith('/404?');

    // Subscribe to authentication state changes
    this.authService.isAuthenticated$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(isAuth => {
      this.isAuthenticated = isAuth;
      this.cdr.markForCheck();
    });

    // Track login modal visibility (drives the @defer + [isOpen] binding in the template)
    this.loginModalService.isOpen$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(isOpen => {
      this.loginModalOpen = isOpen;
      this.cdr.markForCheck();
    });
  }

  onLoginModalOpenChange(isOpen: boolean): void {
    if (!isOpen) {
      this.loginModalService.close();
    }
  }

  onLoginSuccess(): void {
    // Handle successful login - e.g., redirect to dashboard
    this.router.navigate(['/dashboard']);
  }

  get isCustomer(): boolean {
    // Client agents shop on behalf of managed clients, so they get the cart UI too.
    return this.authService.hasRole('ROLE_CLIENT')
      || this.authService.hasRole('ROLE_USER_CLIENT_AGENT');
  }

  /**
   * Gate for the client-status pipeline: browser only, authenticated users with a
   * client only, and at most once per CLIENT_STATUS_TTL_MS per session.
   */
  private shouldCheckClientStatus(): boolean {
    // Never on the server: SSR has no user session, and alert()/modals don't exist there
    if (!this.isBrowser) {
      return false;
    }

    // Skip check if using dummy auth (development mode)
    if ((environment as any).useDummyAuth) {
      return false;
    }

    // Only check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      return false;
    }

    const currentUser = this.authService.getCurrentUser();

    // Only check if user has a client and an email
    if (!currentUser?.email || !currentUser?.client) {
      return false;
    }

    const now = Date.now();
    if (now - this.lastClientStatusCheckAt < AppComponent.CLIENT_STATUS_TTL_MS) {
      return false;
    }
    this.lastClientStatusCheckAt = now;
    return true;
  }

  /**
   * The user's client has been archived: log them out and prompt to re-login.
   */
  private handleArchivedClient(): void {
    this.logger.warn('User\'s client is archived. Logging out...');

    // Log out the user
    this.authService.logout();

    // Redirect to home page
    this.router.navigate(['/']);

    // Show login modal with a slight delay
    setTimeout(() => {
      this.loginModalService.open();
      alert('Your company account has been archived. Please contact support for assistance.');
    }, 500);
  }

}
