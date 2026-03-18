import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
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
import { AddressService } from '@core/services/http/address.service';
import { DeliveryCostService } from '@core/services/http/delivery-cost.service';
import { PaymentTypeService } from '@core/services/http/payment-type.service';
import { DeliveryTypeService } from '@core/services/http/delivery-type.service';
import { AuthService } from '@core/auth/auth.service';
import { ClientAddress } from '@core/models/client.model';
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
  private wishlistService = inject(WishlistService);
  private orderService = inject(OrderService);
  private addressService = inject(AddressService);
  private deliveryCostService = inject(DeliveryCostService);
  private paymentTypeService = inject(PaymentTypeService);
  private deliveryTypeService = inject(DeliveryTypeService);
  private authService = inject(AuthService);

  isPlacingOrder = signal(false);
  orderError = signal<string | null>(null);
  billingAddress = signal('');
  shippingAddress = signal('');
  shippingCountryId = signal<number | null>(null);
  selectedPaymentTypeId = signal<number | null>(null);
  selectedDeliveryTypeId = signal<number | null>(null);
  shippingTaxPercent = signal(0);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Cart', route: '/customer/shop/cart' }
  ];

  // Reactively derive from cart service so items always stay in sync
  cartItems = computed<CheckoutItem[]>(() =>
    this.cartService.cartItems().map(item => ({
      id: item.id,
      product: item.product,
      quantity: item.quantity,
      discount: item.product.discountPercent || item.discountPercent || 0,
      isFavorite: item.isFavorite
    }))
  );

  internalReference = signal('#0001');
  shippingCost = signal(0);
  isLoadingShipping = signal(true);

  itemCount = computed(() => this.cartItems().reduce((sum, item) => sum + item.quantity, 0));

  totalWeight = computed(() =>
    this.cartItems().reduce((sum, item) => {
      const weight = this.deliveryCostService.parseWeight(item.product.weight);
      return sum + (weight * item.quantity);
    }, 0)
  );

  subtotal = computed(() =>
    this.cartItems().reduce((sum, item) => {
      const discountedPrice = item.product.discountedPrice ?? (item.product.price * (1 - item.discount / 100));
      return sum + (discountedPrice * item.quantity);
    }, 0)
  );

  estimatedTax = computed(() => {
    const taxPercent = this.shippingTaxPercent();
    if (taxPercent <= 0) return 0;
    return Math.round(this.subtotal() * taxPercent / 100 * 100) / 100;
  });

  total = computed(() => {
    const sub = this.subtotal();
    return sub > 0 ? sub + this.shippingCost() + this.estimatedTax() : 0;
  });

  getOriginalPrice(item: CheckoutItem): number {
    return item.product.price;
  }

  getDiscountedPrice(item: CheckoutItem): number {
    return item.product.discountedPrice ?? (item.product.price * (1 - item.discount / 100));
  }

  getItemTotal(item: CheckoutItem): number {
    return this.getDiscountedPrice(item) * item.quantity;
  }

  onQuantityChange(item: CheckoutItem, quantity: number): void {
    this.cartService.updateQuantity(item.id, quantity);
    this.recalculateDeliveryCost();
  }

  removeItem(item: CheckoutItem): void {
    this.cartService.removeItem(item.id);
    this.recalculateDeliveryCost();
  }

  private recalculateDeliveryCost(): void {
    const countryId = this.shippingCountryId();
    if (countryId) {
      this.calculateDeliveryCost(countryId);
    }
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

  ngOnInit(): void {
    this.loadClientAddresses();
    this.loadPaymentTypes();
    this.loadDeliveryTypes();
  }

  private loadClientAddresses(): void {
    const user = this.authService.getCurrentUser();
    const clientId = user?.client?.id;
    if (!clientId) {
      this.isLoadingShipping.set(false);
      return;
    }

    this.addressService.getAddressesByClient(clientId).subscribe(addresses => {
      const billing = addresses.find(a => a.isBilling && a.isActive);
      if (billing) {
        this.billingAddress.set(this.addressService.formatAddress(billing));
      }

      const shipping = addresses.find(a => a.isDelivery && a.isActive);
      if (shipping) {
        this.shippingAddress.set(this.addressService.formatAddress(shipping));
        const taxPercent = shipping.country?.taxType?.percent ?? shipping.country?.defaultTaxPercent;
        if (taxPercent) {
          this.shippingTaxPercent.set(parseFloat(taxPercent));
        }
        if (shipping.country?.id) {
          this.shippingCountryId.set(shipping.country.id);
          this.calculateDeliveryCost(shipping.country.id);
        } else {
          this.isLoadingShipping.set(false);
        }
      } else {
        this.isLoadingShipping.set(false);
      }
    });
  }

  private loadPaymentTypes(): void {
    this.paymentTypeService.getPaymentTypes().subscribe({
      next: (response) => {
        const active = response.member.find(pt => pt.isActive);
        if (active) {
          this.selectedPaymentTypeId.set(active.id);
        }
      },
      error: (err) => console.error('Failed to load payment types:', err)
    });
  }

  private loadDeliveryTypes(): void {
    this.deliveryTypeService.getDeliveryTypes().subscribe({
      next: (response) => {
        const active = response.member.find(dt => dt.isActive);
        if (active) {
          this.selectedDeliveryTypeId.set(active.id);
        }
      },
      error: (err) => console.error('Failed to load delivery types:', err)
    });
  }

  private calculateDeliveryCost(countryId: number): void {
    const weight = this.totalWeight();
    this.deliveryCostService.calculateDeliveryCost(countryId, weight).subscribe(result => {
      this.shippingCost.set(result.deliveryCost);
      this.isLoadingShipping.set(false);
    });
  }

  formatDiscount(discount: number): string {
    return `-${discount}%`;
  }

  onPlaceOrder(): void {
    if (this.isPlacingOrder() || this.cartItems().length === 0) {
      return;
    }

    this.isPlacingOrder.set(true);
    this.orderError.set(null);

    const orderData: Record<string, unknown> = {
      notes: this.internalReference(),
      items: this.cartItems().map(item => ({
        product: `/api/v1/products/${item.product.id}`,
        quantity: item.quantity
      })),
      isDraft: false,
      billingAddress: this.billingAddress(),
      shippingAddress: this.shippingAddress(),
      paymentType: this.selectedPaymentTypeId() ? `/api/v1/payment_types/${this.selectedPaymentTypeId()}` : null,
      deliveryType: this.selectedDeliveryTypeId() ? `/api/v1/delivery_types/${this.selectedDeliveryTypeId()}` : null
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

    const orderData: Record<string, unknown> = {
      notes: this.internalReference(),
      items: this.cartItems().map(item => ({
        product: `/api/v1/products/${item.product.id}`,
        quantity: item.quantity
      })),
      isDraft: true,
      billingAddress: this.billingAddress(),
      shippingAddress: this.shippingAddress(),
      paymentType: this.selectedPaymentTypeId() ? `/api/v1/payment_types/${this.selectedPaymentTypeId()}` : null,
      deliveryType: this.selectedDeliveryTypeId() ? `/api/v1/delivery_types/${this.selectedDeliveryTypeId()}` : null
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
