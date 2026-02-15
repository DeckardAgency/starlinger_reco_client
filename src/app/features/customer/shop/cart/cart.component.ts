import { Component, ChangeDetectionStrategy, signal, computed, Output, EventEmitter, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService, CartItem } from '@core/services/cart.service';
import { WishlistService } from '@core/services/wishlist.service';
import { OrderService } from '@core/services/http/order.service';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { ToastComponent } from '@app/ui-kit/molecules/toast/toast.component';
import { QuantitySelectorComponent } from '@app/ui-kit/molecules/quantity-selector/quantity-selector.component';
import { FavoriteButtonComponent } from '@app/ui-kit/atoms/favorite-button/favorite-button.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IconComponent,
    QuantitySelectorComponent,
    FavoriteButtonComponent,
    ToastComponent
  ],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();

  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private orderService = inject(OrderService);
  private router = inject(Router);

  isOpen = signal(true);
  isSavingDraft = signal(false);
  showToast = signal(false);
  toastMessage = signal('');
  toastType = signal<'success' | 'error'>('success');

  ngOnInit(): void {
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }
  internalReference = signal('#0001');
  shippingCost = 49.00;

  cartItems = this.cartService.cartItems;

  itemCount = computed(() => this.cartItems().reduce((sum, item) => sum + item.quantity, 0));
  
  subtotal = computed(() => 
    this.cartItems().reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  );

  total = computed(() => this.subtotal() + this.shippingCost);

  onQuantityChange(item: CartItem, quantity: number): void {
    this.cartService.updateQuantity(item.id, quantity);
  }

  incrementQuantity(item: CartItem): void {
    this.cartService.updateQuantity(item.id, item.quantity + 1);
  }

  decrementQuantity(item: CartItem): void {
    this.cartService.updateQuantity(item.id, Math.max(1, item.quantity - 1));
  }

  removeItem(item: CartItem): void {
    this.cartService.removeItem(item.id);
  }

  toggleFavorite(item: CartItem): void {
    const wasInWishlist = item.isFavorite;
    this.cartService.toggleFavorite(item.id);

    if (!wasInWishlist) {
      this.wishlistService.addItem({
        productId: item.product.id,
        productCode: item.product.code,
        productName: item.product.name,
        imageUrl: item.product.image,
        price: item.product.price,
        quantity: 1,
        isFavorite: true
      });
    } else {
      const wishlistItem = this.wishlistService.wishlistItems().find(i => i.productCode === item.product.code);
      if (wishlistItem) {
        this.wishlistService.removeItem(wishlistItem.id);
      }
    }
  }

  onReferenceChange(value: string): void {
    this.internalReference.set(value);
  }

  formatPrice(price: number): string {
    return `€ ${price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  onBackToProducts(): void {
    this.closeCart();
    this.router.navigate(['/customer/shop/products']);
  }

  onSaveDraft(): void {
    if (this.isSavingDraft() || this.cartItems().length === 0) {
      return;
    }

    this.isSavingDraft.set(true);

    const orderData = {
      notes: this.internalReference(),
      items: this.cartItems().map(item => ({
        product: `/api/v1/products/${item.product.id}`,
        quantity: item.quantity
      })),
      isDraft: true
    };

    this.orderService.createOrder(orderData).subscribe({
      next: () => {
        this.cartService.clearCart();
        this.isSavingDraft.set(false);
        this.toastType.set('success');
        this.toastMessage.set('Draft saved successfully.');
        this.showToast.set(true);
        setTimeout(() => this.closeCart(), 1500);
      },
      error: (error) => {
        console.error('Failed to save draft:', error);
        this.isSavingDraft.set(false);
        this.toastType.set('error');
        this.toastMessage.set('Failed to save draft. Please try again.');
        this.showToast.set(true);
      }
    });
  }

  onToastClosed(): void {
    this.showToast.set(false);
  }

  onCheckout(): void {
    this.closeCart();
    this.router.navigate(['/customer/shop/checkout']);
  }

  closeCart(): void {
    this.isOpen.set(false);
    setTimeout(() => {
      this.close.emit();
      this.cartService.closeCart();
    }, 300);
  }

  onScrimClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('cart-overlay')) {
      this.closeCart();
    }
  }
}
