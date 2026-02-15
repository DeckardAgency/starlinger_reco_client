import { Component, ChangeDetectionStrategy, signal, computed, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { WishlistService } from '@core/services/wishlist.service';
import { CartService } from '@core/services/cart.service';
import { WishlistItem } from '@core/models/wishlist.model';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { QuantitySelectorComponent } from '@app/ui-kit/molecules/quantity-selector/quantity-selector.component';
import { FavoriteButtonComponent } from '@app/ui-kit/atoms/favorite-button/favorite-button.component';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IconComponent,
    QuantitySelectorComponent,
    FavoriteButtonComponent
  ],
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WishlistComponent {
  @Output() close = new EventEmitter<void>();
  @Output() addToCart = new EventEmitter<WishlistItem[]>();

  private wishlistService = inject(WishlistService);
  private cartService = inject(CartService);
  private router = inject(Router);

  isOpen = signal(true);

  wishlistItems = this.wishlistService.wishlistItems;

  itemCount = computed(() => this.wishlistItems().reduce((sum, item) => sum + item.quantity, 0));

  onQuantityChange(item: WishlistItem, quantity: number): void {
    this.wishlistService.updateQuantity(item.id, quantity);
  }

  incrementQuantity(item: WishlistItem): void {
    this.wishlistService.updateQuantity(item.id, item.quantity + 1);
  }

  decrementQuantity(item: WishlistItem): void {
    this.wishlistService.updateQuantity(item.id, Math.max(1, item.quantity - 1));
  }

  removeItem(item: WishlistItem): void {
    this.wishlistService.removeItem(item.id);
  }

  formatPrice(price: number): string {
    return `€ ${price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  onBackToProducts(): void {
    this.closeWishlist();
    this.router.navigate(['/customer/shop/products']);
  }

  onAddToCart(): void {
    const items = this.wishlistItems();
    for (const item of items) {
      this.cartService.addItem({
        id: item.productId,
        code: item.productCode,
        name: item.productName,
        price: item.price,
        image: item.imageUrl,
        isFavorite: true,
        group: ''
      }, item.quantity);
    }
    this.wishlistService.clearWishlist();
    this.closeWishlist();
    this.cartService.openCart();
  }

  onShowWishlist(): void {
    this.closeWishlist();
    this.router.navigate(['/customer/shop/wishlist']);
  }

  closeWishlist(): void {
    this.isOpen.set(false);
    setTimeout(() => {
      this.close.emit();
      this.wishlistService.closeWishlist();
    }, 300);
  }

  onScrimClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('wishlist-overlay')) {
      this.closeWishlist();
    }
  }
}
