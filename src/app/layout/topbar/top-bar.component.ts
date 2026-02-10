import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchComponent, SearchSuggestion } from '@app/ui-kit/molecules/search/search.component';
import { MobileMenuService } from '@services/mobile-menu.service';
import { CartService } from '@core/services/cart.service';
import { WishlistService } from '@core/services/wishlist.service';
import { AuthService } from '@core/auth/auth.service';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-top-bar',
    standalone: true,
    imports: [CommonModule, SearchComponent],
    templateUrl: './top-bar.component.html',
    styleUrls: ['./top-bar.component.scss']
})
export class TopBarComponent implements OnInit, OnDestroy {
    showNotificationDropdown = false;
    showMobileSearch = false;
    searchSuggestions: SearchSuggestion[] = [];
    searchLoading = false;

    private destroy$ = new Subject<void>();

    constructor(
        private mobileMenuService: MobileMenuService,
        public cartService: CartService,
        public wishlistService: WishlistService,
        public authService: AuthService
    ) {}

    ngOnInit(): void {}

    /**
     * Check if current user is a Customer (Client)
     * Only true if user has CLIENT but NOT CLIENT_ADMIN or SUPER_ADMIN
     */
    get isCustomer(): boolean {
        return this.authService.hasRole('ROLE_CLIENT') && 
               !this.authService.hasRole('ROLE_CLIENT_ADMIN') &&
               !this.authService.hasRole('ROLE_SUPER_ADMIN');
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

    openMobileSearch(): void {
        this.showMobileSearch = !this.showMobileSearch;
    }

    closeMobileSearch(): void {
        this.showMobileSearch = false;
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


    onSearch(query: string): void {
        this.searchLoading = true;
        // TODO: Replace with actual search service call
        // For now, simulate search with mock data
        setTimeout(() => {
            this.searchSuggestions = [
                { id: '1', label: 'AIVV-01152 Power Panel T30', description: 'Spare part', type: 'Part' },
                { id: '2', label: 'AIVV-01210 Power Panel T30', description: 'Spare part', type: 'Part' },
            ].filter(s => s.label.toLowerCase().includes(query.toLowerCase()));
            this.searchLoading = false;
        }, 300);
    }

    onSuggestionSelect(suggestion: SearchSuggestion): void {
        console.log('Selected:', suggestion);
        // TODO: Navigate to the selected item
        // this.router.navigate(['/details', suggestion.id]);
    }

}
