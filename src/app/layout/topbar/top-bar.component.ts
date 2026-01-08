import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SearchComponent } from '@shared/components/ui/search/search.component';
import { MobileMenuService } from '@services/mobile-menu.service';
import { InfoRequestNotificationService } from '@core/services/info-request-notification.service';
import { CartService } from '@core/services/cart.service';
import { WishlistService } from '@core/services/wishlist.service';
import { AuthService } from '@core/auth/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-top-bar',
    imports: [CommonModule, SearchComponent],
    templateUrl: './top-bar.component.html',
    styleUrls: ['./top-bar.component.scss']
})
export class TopBarComponent implements OnInit, OnDestroy {
    showNotificationDropdown = false;

    private destroy$ = new Subject<void>();

    constructor(
        private mobileMenuService: MobileMenuService,
        private notificationService: InfoRequestNotificationService,
        private router: Router,
        public cartService: CartService,
        public wishlistService: WishlistService,
        public authService: AuthService
    ) {}

    get notificationState$() {
        return this.notificationService.state$;
    }

    ngOnInit(): void {}

    get isCustomer(): boolean {
        return this.authService.hasRole('ROLE_CLIENT');
    }

    get cartItemCount(): number {
        return this.cartService.itemCount;
    }

    get wishlistItemCount(): number {
        return this.wishlistService.itemCount;
    }

    openCart(): void {
        this.cartService.openCart();
    }

    openWishlist(): void {
        this.wishlistService.openWishlist();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    toggleMobileMenu(): void {
        this.mobileMenuService.toggle();
    }

    toggleNotificationDropdown(): void {
        this.showNotificationDropdown = !this.showNotificationDropdown;
    }

    closeNotificationDropdown(): void {
        this.showNotificationDropdown = false;
    }

    toggleNotifications(enabled: boolean): void {
        this.notificationService.toggleNotifications(enabled);
    }

    toggleSound(enabled: boolean): void {
        this.notificationService.toggleSound(enabled);
    }

    requestPermission(): void {
        this.notificationService.requestPermission();
    }

    testNotification(): void {
        this.notificationService.testNotification();
    }

    viewAllResponses(): void {
        this.notificationService.clearNewResponsesCount();
        this.closeNotificationDropdown();
        this.router.navigate(['/info-requests/list'], { queryParams: { tab: 'responded' } });
    }

    getPermissionStatus(): string {
        const status = this.notificationService.getPermissionStatus();
        if (status === 'granted') return 'Enabled';
        if (status === 'denied') return 'Blocked';
        if (status === 'default') return 'Not set';
        return 'Not supported';
    }
}
