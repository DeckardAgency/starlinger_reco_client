import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BreadcrumbsComponent, BreadcrumbItem } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { QuantitySelectorComponent } from '@app/ui-kit/molecules/quantity-selector/quantity-selector.component';
import { FavoriteButtonComponent } from '@app/ui-kit/atoms/favorite-button/favorite-button.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { CartService } from '@core/services/cart.service';
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
export class CheckoutComponent implements OnInit {
  private router = inject(Router);
  private cartService = inject(CartService);
  private orderService = inject(OrderService);

  isPlacingOrder = signal(false);
  orderError = signal<string | null>(null);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Cart', route: '/customer/shop/cart' }
  ];

  cartItems = signal<CheckoutItem[]>([]);
  internalReference = signal('#0001');
  shippingCost = 49.00;

  itemCount = computed(() => this.cartItems().reduce((sum, item) => sum + item.quantity, 0));

  subtotal = computed(() => 
    this.cartItems().reduce((sum, item) => {
      const discountedPrice = item.product.price * (1 - item.discount / 100);
      return sum + (discountedPrice * item.quantity);
    }, 0)
  );

  total = computed(() => this.subtotal() + this.shippingCost);

  ngOnInit(): void {
    this.loadCartItems();
  }

  private loadCartItems(): void {
    // Load items from cart service
    const serviceItems = this.cartService.cartItems();
    this.cartItems.set(serviceItems.map(item => ({
      id: item.id,
      product: item.product,
      quantity: item.quantity,
      discount: 0, // No discount by default, could be added from API
      isFavorite: item.isFavorite
    })));
  }

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
    this.cartItems.update(items => 
      items.map(i => i.id === item.id ? { ...i, quantity } : i)
    );
  }

  incrementQuantity(item: CheckoutItem): void {
    this.cartItems.update(items => 
      items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
    );
  }

  decrementQuantity(item: CheckoutItem): void {
    this.cartItems.update(items => 
      items.map(i => i.id === item.id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i)
    );
  }

  removeItem(item: CheckoutItem): void {
    this.cartItems.update(items => items.filter(i => i.id !== item.id));
  }

  toggleFavorite(item: CheckoutItem): void {
    this.cartItems.update(items => 
      items.map(i => i.id === item.id ? { ...i, isFavorite: !i.isFavorite } : i)
    );
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

    // Build order data from cart items
    const orderData = {
      internalReference: this.internalReference(),
      items: this.cartItems().map(item => ({
        product: `/api/v1/products/${item.product.id}`,
        quantity: item.quantity,
        unitPrice: this.getDiscountedPrice(item)
      })),
      isDraft: false
    };

    this.orderService.createOrder(orderData).subscribe({
      next: (order) => {
        // Clear cart on successful order
        this.cartService.clearCart();
        this.isPlacingOrder.set(false);

        // Navigate to order success page with order number from API
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
    console.log('Save draft:', {
      items: this.cartItems(),
      reference: this.internalReference()
    });
  }
}
