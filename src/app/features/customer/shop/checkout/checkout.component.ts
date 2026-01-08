import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BreadcrumbsComponent, BreadcrumbItem } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { mockShopProducts, ShopProduct } from '@core/mocks/mock-data';

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
    BreadcrumbsComponent
  ],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutComponent {
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

  constructor(private router: Router) {
    this.loadCartItems();
  }

  private loadCartItems(): void {
    // Mock cart items with different quantities and discounts
    const products = mockShopProducts.slice(0, 5);
    this.cartItems.set(products.map((product, index) => ({
      id: `cart-${product.id}`,
      product,
      quantity: [8, 3, 1, 2, 3][index] || 1,
      discount: 20,
      isFavorite: false
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
    console.log('Place order:', {
      items: this.cartItems(),
      reference: this.internalReference(),
      total: this.total()
    });
    
    // Generate order number (in real app, this would come from the backend)
    const orderNumber = `STRL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Navigate to order success page
    this.router.navigate(['/customer/shop/order-success'], {
      queryParams: { orderNumber }
    });
  }

  onSaveDraft(): void {
    console.log('Save draft:', {
      items: this.cartItems(),
      reference: this.internalReference()
    });
  }
}

