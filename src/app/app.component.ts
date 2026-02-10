import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { TopBarComponent } from './layout/topbar/top-bar.component';
import { AsyncPipe, NgIf } from '@angular/common';
import { filter } from 'rxjs/operators';
import { SidebarService } from '@services/sidebar.service';
import { LoginModalService } from '@services/login-modal.service';
import { LoginModalComponent } from '@shared/components/modals/login-modal/login-modal.component';
import { AuthService } from '@core/auth/auth.service';
import { CartService } from '@core/services/cart.service';
import { WishlistService } from '@core/services/wishlist.service';
import { MobileMenuComponent } from './layout/mobile-menu/mobile-menu.component';
import { CartComponent } from '@features/customer/shop/cart/cart.component';
import { WishlistComponent } from '@features/customer/shop/wishlist/wishlist.component';
import { UserService } from '@services/http/user.service';
import { LoggerService, ScopedLogger } from '@services/logger.service';
import { environment } from '@env/environment';

@Component({
    selector: 'app-root',
    imports: [
      RouterOutlet,
      SidebarComponent,
      TopBarComponent,
      AsyncPipe,
      NgIf,
      LoginModalComponent,
      MobileMenuComponent,
      CartComponent,
      WishlistComponent
    ],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'starlinger_reco_client';
  currentRoute: string = '';
  isAuthenticated: boolean = false;
  isAuthPage: boolean = false;
  is404Page: boolean = false;

  private readonly authRoutes = ['/login', '/forgot-password'];

  private destroyRef = inject(DestroyRef);
  private logger!: ScopedLogger;

  constructor(
    public sidebarService: SidebarService,
    private router: Router,
    public loginModalService: LoginModalService,
    private authService: AuthService,
    public cartService: CartService,
    public wishlistService: WishlistService,
    private userService: UserService,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('AppComponent');

    // Subscribe to router events to keep track of current route
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.url;
      this.isAuthPage = this.authRoutes.some(route => event.url.startsWith(route));
      this.is404Page = event.url === '/404' || event.url.startsWith('/404?');

      // Check client status on every route change
      this.checkClientStatus();
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
    });
  }

  ngOnInit(): void {
    // Check client status on app initialization if user is already logged in
    this.checkClientStatus();
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
    return this.authService.hasRole('ROLE_CLIENT');
  }

  /**
   * Check if user's client is archived and log them out if so
   */
  private checkClientStatus(): void {
    // Skip check if using dummy auth (development mode)
    if ((environment as any).useDummyAuth) {
      return;
    }

    // Only check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      return;
    }

    const currentUser = this.authService.getCurrentUser();

    // Only check if user has a client and an email
    if (!currentUser?.email || !currentUser?.client) {
      return;
    }

    // Fetch fresh user data from the API to check current client status
    this.userService.getUserByEmail(currentUser.email).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (userData) => {
        // Check if the client is archived
        if (userData?.client?.isArchived) {
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
      },
      error: (error) => {
        this.logger.error('Error checking client status:', error);
      }
    });
  }

}
