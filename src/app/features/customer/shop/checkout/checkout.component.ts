import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BreadcrumbsComponent, BreadcrumbItem } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { QuantitySelectorComponent } from '@app/ui-kit/molecules/quantity-selector/quantity-selector.component';
import { FavoriteButtonComponent } from '@app/ui-kit/atoms/favorite-button/favorite-button.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { ToastComponent } from '@app/ui-kit/molecules/toast/toast.component';
import { CartService } from '@core/services/cart.service';
import { WishlistService } from '@core/services/wishlist.service';
import { OrderService } from '@core/services/http/order.service';
import { AddressService } from '@core/services/http/address.service';
import { DeliveryCostService } from '@core/services/http/delivery-cost.service';
import { PaymentTypeService } from '@core/services/http/payment-type.service';
import { DeliveryTypeService } from '@core/services/http/delivery-type.service';
import { AuthService } from '@core/auth/auth.service';
import { USER_ROLES } from '@core/models/auth.model';
import { ClientAddress } from '@core/models/client.model';
import { ShopProduct } from '@core/models/shop-product.model';

export interface CheckoutItem {
  id: string;
  product: ShopProduct;
  quantity: number;
  discount: number;
  isFavorite: boolean;
  clientId?: number;
  clientName?: string;
  clientCode?: string;
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
    IconComponent,
    ToastComponent
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
  showToast = signal(false);
  toastMessage = signal('');
  toastType = signal<'success' | 'error'>('success');
  billingAddress = signal('');
  shippingAddress = signal('');
  shippingCountryId = signal<number | null>(null);
  selectedPaymentTypeId = signal<number | null>(null);
  selectedDeliveryTypeId = signal<number | null>(null);
  shippingTaxPercent = signal(0);

  // Multiple delivery addresses for customer to choose from
  availableShippingAddresses = signal<ClientAddress[]>([]);
  selectedShippingAddressId = signal<number | null>(null);

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
      isFavorite: item.isFavorite,
      clientId: item.clientId,
      clientName: item.clientName,
      clientCode: item.clientCode
    }))
  );

  /** Client agents review the order grouped into a section per managed client. */
  get isAgent(): boolean {
    return this.authService.hasRole(USER_ROLES.CLIENT_AGENT);
  }

  /** Per-client grouping of the checkout items for the agent view. */
  groupedByClient = computed(() => {
    const groups = new Map<number, { clientId: number; clientName: string; clientCode: string; items: CheckoutItem[] }>();
    for (const item of this.cartItems()) {
      const key = item.clientId ?? -1;
      const g = groups.get(key)
        ?? {
          clientId: key,
          clientName: item.clientName ?? 'My Company',
          clientCode: item.clientCode ?? '',
          items: []
        };
      g.items.push(item);
      groups.set(key, g);
    }
    return Array.from(groups.values());
  });

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

  taxLabel = computed(() => {
    const rate = this.shippingTaxPercent();
    return rate > 0 ? `Tax (${rate}%)` : 'Tax';
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

  onQuantityAdjusted(event: { original: number; adjusted: number; step: number }): void {
    this.toastType.set('success');
    this.toastMessage.set(`Quantity adjusted to ${event.adjusted} to match the minimum step of ${event.step}.`);
    this.showToast.set(true);
  }

  onToastClosed(): void {
    this.showToast.set(false);
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

      // Multiple delivery addresses are now allowed; user picks one at checkout.
      const deliveryAddresses = addresses.filter(a => a.isDelivery && a.isActive);
      this.availableShippingAddresses.set(deliveryAddresses);

      if (deliveryAddresses.length > 0) {
        // Default to the first one
        this.applyShippingAddress(deliveryAddresses[0]);
      } else {
        this.isLoadingShipping.set(false);
      }
    });
  }

  onShippingAddressChange(addressId: number | string): void {
    const id = Number(addressId);
    const address = this.availableShippingAddresses().find(a => a.id === id);
    if (address) {
      this.applyShippingAddress(address);
    }
  }

  formatAddressOption(addr: ClientAddress): string {
    return this.addressService.formatAddress(addr);
  }

  private applyShippingAddress(address: ClientAddress): void {
    this.selectedShippingAddressId.set(address.id);
    this.shippingAddress.set(this.addressService.formatAddress(address));
    const taxPercent = address.country?.taxType?.percent;
    this.shippingTaxPercent.set(taxPercent ? parseFloat(taxPercent) : 0);
    if (address.country?.id) {
      this.shippingCountryId.set(address.country.id);
      this.calculateDeliveryCost(address.country.id);
    } else {
      this.shippingCountryId.set(null);
      this.isLoadingShipping.set(false);
    }
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
      this.shippingCost.set(result.totalShippingCost);
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
      items: this.cartItems().map(item => this.toOrderItem(item)),
      isDraft: false,
      billingAddress: this.billingAddress(),
      shippingAddress: this.shippingAddress(),
      shippingAddressId: this.selectedShippingAddressId(),
      paymentType: this.selectedPaymentTypeId() ? `/api/v1/payment_types/${this.selectedPaymentTypeId()}` : null,
      deliveryType: this.selectedDeliveryTypeId() ? `/api/v1/delivery_types/${this.selectedDeliveryTypeId()}` : null,
      onBehalfOfClient: this.orderLevelOnBehalfOfIri()
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

  /**
   * Order-level on-behalf-of IRI — set only when the entire cart is for a single
   * managed client. Mixed-client carts carry the client per line instead (and the
   * order-level stays null). The backend re-validates and strips for non-agents.
   */
  private orderLevelOnBehalfOfIri(): string | null {
    const ids = new Set(
      this.cartItems().map(i => i.clientId).filter((id): id is number => id != null)
    );
    return ids.size === 1 ? `/api/v1/clients/${[...ids][0]}` : null;
  }

  /** Maps a cart line to its API item payload, stamping per-line on-behalf-of. */
  private toOrderItem(item: CheckoutItem): Record<string, unknown> {
    return {
      product: `/api/v1/products/${item.product.id}`,
      quantity: item.quantity,
      ...(item.clientId ? { onBehalfOfClient: `/api/v1/clients/${item.clientId}` } : {})
    };
  }

  onSaveDraft(): void {
    if (this.isPlacingOrder() || this.cartItems().length === 0) {
      return;
    }

    this.isPlacingOrder.set(true);
    this.orderError.set(null);

    const orderData: Record<string, unknown> = {
      notes: this.internalReference(),
      items: this.cartItems().map(item => this.toOrderItem(item)),
      isDraft: true,
      billingAddress: this.billingAddress(),
      shippingAddress: this.shippingAddress(),
      shippingAddressId: this.selectedShippingAddressId(),
      paymentType: this.selectedPaymentTypeId() ? `/api/v1/payment_types/${this.selectedPaymentTypeId()}` : null,
      deliveryType: this.selectedDeliveryTypeId() ? `/api/v1/delivery_types/${this.selectedDeliveryTypeId()}` : null,
      onBehalfOfClient: this.orderLevelOnBehalfOfIri()
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
