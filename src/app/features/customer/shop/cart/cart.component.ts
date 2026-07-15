import { Component, ChangeDetectionStrategy, signal, computed, Output, EventEmitter, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService, CartItem } from '@core/services/cart.service';
import { WishlistService } from '@core/services/wishlist.service';
import { OrderService } from '@core/services/http/order.service';
import { AddressService } from '@core/services/http/address.service';
import { DeliveryCostService } from '@core/services/http/delivery-cost.service';
import { AuthService } from '@core/auth/auth.service';
import { USER_ROLES } from '@core/models/auth.model';
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
  private addressService = inject(AddressService);
  private deliveryCostService = inject(DeliveryCostService);
  private authService = inject(AuthService);
  private router = inject(Router);

  isOpen = signal(true);
  isSavingDraft = signal(false);
  billingAddress = signal('');
  shippingAddress = signal('');
  shippingCountryId = signal<number | null>(null);
  showToast = signal(false);
  toastMessage = signal('');
  toastType = signal<'success' | 'error'>('success');

  ngOnInit(): void {
    document.body.style.overflow = 'hidden';
    this.loadClientAddresses();
  }

  private loadClientAddresses(): void {
    const user = this.authService.getCurrentUser();
    const clientId = user?.client?.id;
    if (!clientId) {
      this.isLoadingShipping.set(false);
      return;
    }

    this.addressService.getAddressesByClient(clientId).subscribe({
      next: (addresses) => {
        const billing = addresses.find(a => a.isBilling && a.isActive);
        if (billing) {
          this.billingAddress.set(this.addressService.formatAddress(billing));
        }
        const shipping = addresses.find(a => a.isDelivery && a.isActive);
        if (shipping) {
          this.shippingAddress.set(this.addressService.formatAddress(shipping));
          if (shipping.country?.id) {
            this.shippingCountryId.set(shipping.country.id);
            this.calculateDeliveryCost(shipping.country.id);
          } else {
            this.isLoadingShipping.set(false);
          }
        } else {
          this.isLoadingShipping.set(false);
        }
      },
      error: (err) => {
        // Without this the shipping spinner would stick forever on failure.
        console.error('Failed to load addresses:', err);
        this.isLoadingShipping.set(false);
        this.toastType.set('error');
        this.toastMessage.set('Could not load your addresses. Please try again.');
        this.showToast.set(true);
      }
    });
  }

  private calculateDeliveryCost(countryId: number): void {
    const weight = this.totalWeight();
    this.deliveryCostService.calculateDeliveryCost(countryId, weight).subscribe(result => {
      this.shippingCost.set(result.totalShippingCost);
      this.isLoadingShipping.set(false);
    });
  }

  private recalculateDeliveryCost(): void {
    const countryId = this.shippingCountryId();
    if (countryId) {
      this.calculateDeliveryCost(countryId);
    }
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }
  internalReference = signal('#0001');
  shippingCost = signal(0);
  isLoadingShipping = signal(true);

  cartItems = this.cartService.cartItems;

  /** Client agents see the cart grouped into a collapsible section per managed client. */
  get isAgent(): boolean {
    return this.authService.hasRole(USER_ROLES.CLIENT_AGENT);
  }

  /**
   * Per-client grouping of the cart for the agent view. Lines are already
   * de-duplicated per (product, client) by the cart service, so each client's
   * items are distinct. Lines with no client fall into a "My Company" group.
   */
  groupedByClient = computed(() => {
    const groups = new Map<number, { clientId: number; clientName: string; clientCode: string; items: CartItem[] }>();
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

  private collapsedGroups = signal<Set<number>>(new Set());

  isExpanded(clientId: number): boolean {
    return !this.collapsedGroups().has(clientId);
  }

  toggleGroup(clientId: number): void {
    this.collapsedGroups.update(prev => {
      const next = new Set(prev);
      next.has(clientId) ? next.delete(clientId) : next.add(clientId);
      return next;
    });
  }

  itemCount = computed(() => this.cartItems().reduce((sum, item) => sum + item.quantity, 0));

  totalWeight = computed(() =>
    this.cartItems().reduce((sum, item) => {
      const weight = this.deliveryCostService.parseWeight(item.product.weight);
      return sum + (weight * item.quantity);
    }, 0)
  );

  subtotal = computed(() =>
    this.cartItems().reduce((sum, item) => {
      const price = item.product.discountedPrice ?? item.product.price;
      return sum + (price * item.quantity);
    }, 0)
  );

  total = computed(() => {
    const sub = this.subtotal();
    return sub > 0 ? sub + this.shippingCost() : 0;
  });

  onQuantityChange(item: CartItem, quantity: number): void {
    this.cartService.updateQuantity(item.id, quantity);
    this.recalculateDeliveryCost();
  }

  onQuantityAdjusted(event: { original: number; adjusted: number; step: number }): void {
    this.toastType.set('success');
    this.toastMessage.set(`Quantity adjusted to ${event.adjusted} to match the minimum step of ${event.step}.`);
    this.showToast.set(true);
  }

  incrementQuantity(item: CartItem): void {
    this.cartService.updateQuantity(item.id, item.quantity + 1);
    this.recalculateDeliveryCost();
  }

  decrementQuantity(item: CartItem): void {
    this.cartService.updateQuantity(item.id, Math.max(1, item.quantity - 1));
    this.recalculateDeliveryCost();
  }

  removeItem(item: CartItem): void {
    this.cartService.removeItem(item.id);
    this.recalculateDeliveryCost();
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

    const orderData: Record<string, unknown> = {
      notes: this.internalReference(),
      items: this.cartItems().map(item => ({
        product: `/api/v1/products/${item.product.id}`,
        quantity: item.quantity
      })),
      isDraft: true,
      billingAddress: this.billingAddress(),
      shippingAddress: this.shippingAddress()
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
