import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BreadcrumbsComponent, BreadcrumbItem } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { QuantitySelectorComponent } from '@app/ui-kit/molecules/quantity-selector/quantity-selector.component';
import { FavoriteButtonComponent } from '@app/ui-kit/atoms/favorite-button/favorite-button.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { CartService } from '@core/services/cart.service';
import { WishlistService } from '@core/services/wishlist.service';
import { OrderService } from '@core/services/http/order.service';
import { ShopProduct } from '@core/mocks/mock-data';

export interface CheckoutItem {
  id: string;
  product: ShopProduct;
  quantity: number;
  discount: number;
  isFavorite: boolean;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbsComponent,
    QuantitySelectorComponent,
    FavoriteButtonComponent,
    IconComponent
  ],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutComponent {
  private router = inject(Router);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private orderService = inject(OrderService);

  isPlacingOrder = signal(false);
  orderError = signal<string | null>(null);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Cart', route: '/customer/shop/cart' }
  ];

  // Reactively derive from cart service so items always stay in sync
  cartItems = computed<CheckoutItem[]>(() =>
    this.cartService.cartItems().map(item => ({
      id: item.id,
      product: item.product,
      quantity: item.quantity,
      discount: 0,
      isFavorite: item.isFavorite
    }))
  );

  internalReference = signal('#0001');
  shippingCost = 49.00;

  itemCount = computed(() => this.cartItems().reduce((sum, item) => sum + item.quantity, 0));

  subtotal = computed(() =>
    this.cartItems().reduce((sum, item) => {
      const discountedPrice = item.product.price * (1 - item.discount / 100);
      return sum + (discountedPrice * item.quantity);
    }, 0)
  );

  total = computed(() => {
    const sub = this.subtotal();
    return sub > 0 ? sub + this.shippingCost : 0;
  });

  getOriginalPrice(item: CheckoutItem): number {
    return item.product.price;
  }

  getDiscountedPrice(item: CheckoutItem): number {
    return item.product.price * (1 - item.discount / 100);
  }

  getItemTotal(item: CheckoutItem): number {
    return this.getDiscountedPrice(item) * item.quantity;
  }

  onQuantityChange(item: CheckoutItem, quantity: number): void {
    this.cartService.updateQuantity(item.id, quantity);
  }

  removeItem(item: CheckoutItem): void {
    this.cartService.removeItem(item.id);
  }

  toggleFavorite(item: CheckoutItem): void {
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

  formatDiscount(discount: number): string {
    return `-${discount}%`;
  }

  onPlaceOrder(): void {
    if (this.isPlacingOrder()) {
      return;
    }

    this.isPlacingOrder.set(true);
    this.orderError.set(null);

    const orderData = {
      notes: this.internalReference(),
      items: this.cartItems().map(item => ({
        product: `/api/v1/products/${item.product.id}`,
        quantity: item.quantity
      })),
      isDraft: false
    };

    this.orderService.createOrder(orderData).subscribe({
      next: (order) => {
        this.cartService.clearCart();
        this.isPlacingOrder.set(false);
        this.router.navigate(['/customer/shop/order-success'], {
          queryParams: { orderNumber: order.orderNumber || order.id }
        });
      },
      error: (error) => {
        console.error('Failed to create order:', error);
        this.orderError.set('Failed to place order. Please try again.');
        this.isPlacingOrder.set(false);
      }
    });
  }

  onSaveDraft(): void {
    if (this.isPlacingOrder() || this.cartItems().length === 0) {
      return;
    }

    this.isPlacingOrder.set(true);
    this.orderError.set(null);

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
        this.isPlacingOrder.set(false);
        this.router.navigate(['/customer/shop/products']);
      },
      error: (error) => {
        console.error('Failed to save draft:', error);
        this.orderError.set('Failed to save draft. Please try again.');
        this.isPlacingOrder.set(false);
      }
    });
  }
}
