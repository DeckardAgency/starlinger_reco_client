import { Component, ChangeDetectionStrategy, signal, computed, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService, CartItem } from '@core/services/cart.service';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
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
    FavoriteButtonComponent
  ],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartComponent {
  @Output() close = new EventEmitter<void>();

  private cartService = inject(CartService);
  private router = inject(Router);

  isOpen = signal(true);
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
    this.cartService.toggleFavorite(item.id);
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
    console.log('Save draft:', {
      items: this.cartItems(),
      reference: this.internalReference()
    });
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
