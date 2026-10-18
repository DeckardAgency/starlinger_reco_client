import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Params, Router, RouterModule } from '@angular/router';
import { BreadcrumbsComponent, BreadcrumbItem } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { QuantitySelectorComponent } from '@app/ui-kit/molecules/quantity-selector/quantity-selector.component';
import { FavoriteButtonComponent } from '@app/ui-kit/atoms/favorite-button/favorite-button.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { ToastComponent } from '@app/ui-kit/molecules/toast/toast.component';
import { CartService } from '@core/services/cart.service';
import { WishlistService } from '@core/services/wishlist.service';
import { OrderService } from '@core/services/http/order.service';
import { NotificationService } from '@core/services/notification.service';
import { AddressService } from '@core/services/http/address.service';
import { DeliveryCostService } from '@core/services/http/delivery-cost.service';
import { PaymentTypeService } from '@core/services/http/payment-type.service';
import { DeliveryTypeService } from '@core/services/http/delivery-type.service';
import { AuthService } from '@core/auth/auth.service';
import { USER_ROLES } from '@core/models/auth.model';
import { ClientAddress } from '@core/models/client.model';
import { CheckoutPayload } from '@core/models/order.model';
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

/** Group key of the lines ordered for the logged-in user's own company. */
export const OWN_COMPANY_GROUP = -1;

/** The cart lines that become ONE order: a managed client's lines (agents) or the whole cart. */
export interface CheckoutGroup {
  /** Managed client id, or OWN_COMPANY_GROUP (-1) for the user's own company. */
  clientId: number;
  clientName: string;
  clientCode: string;
  items: CheckoutItem[];
}

/** Address + delivery-cost state of one checkout group, keyed by CheckoutGroup.clientId. */
export interface GroupCheckoutState {
  /** Active delivery addresses the user can ship this group to. */
  addresses: ClientAddress[];
  selectedShippingAddressId: number | null;
  shippingAddressText: string;
  billingAddressId: number | null;
  billingAddressText: string;
  countryId: number | null;
  taxPercent: number;
  shippingCost: number;
  /** True while the addresses are being fetched or the delivery cost is being calculated. */
  loading: boolean;
  /** True when the delivery cost could not be calculated (blocks order placement). */
  error: boolean;
}

/** State of a group whose addresses have not been loaded yet. */
const PENDING_GROUP_STATE: GroupCheckoutState = {
  addresses: [],
  selectedShippingAddressId: null,
  shippingAddressText: '',
  billingAddressId: null,
  billingAddressText: '',
  countryId: null,
  taxPercent: 0,
  shippingCost: 0,
  loading: true,
  error: false
};

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
  private notification = inject(NotificationService);
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
  selectedPaymentTypeId = signal<number | null>(null);
  selectedDeliveryTypeId = signal<number | null>(null);

  /**
   * Per-group address/delivery state keyed by CheckoutGroup.clientId. Agents get
   * one entry per managed client (+ -1 for own-company lines); everyone else a
   * single -1 entry for the whole cart.
   */
  groupStates = signal<Record<number, GroupCheckoutState>>({});

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
  groupedByClient = computed<CheckoutGroup[]>(() => {
    const groups = new Map<number, CheckoutGroup>();
    for (const item of this.cartItems()) {
      const key = item.clientId ?? OWN_COMPANY_GROUP;
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

  /**
   * The groups this checkout produces orders for: agents place one order per
   * client group, everyone else a single order for the whole cart. Addresses and
   * delivery costs are resolved per group so both modes share one code path.
   */
  checkoutGroups = computed<CheckoutGroup[]>(() =>
    this.isAgent
      ? this.groupedByClient()
      : [{ clientId: OWN_COMPANY_GROUP, clientName: 'My Company', clientCode: '', items: this.cartItems() }]
  );

  /** Each checkout group paired with its address/delivery state (pending until loaded). */
  groupViews = computed(() =>
    this.checkoutGroups().map(group => ({
      group,
      state: this.groupStates()[group.clientId] ?? PENDING_GROUP_STATE
    }))
  );

  // Single-address (non-agent) sidebar bindings — the own-company group's state.
  private ownGroupState = computed(() => this.groupStates()[OWN_COMPANY_GROUP] ?? PENDING_GROUP_STATE);
  availableShippingAddresses = computed(() => this.ownGroupState().addresses);
  selectedShippingAddressId = computed(() => this.ownGroupState().selectedShippingAddressId);
  shippingAddress = computed(() => this.ownGroupState().shippingAddressText);
  billingAddress = computed(() => this.ownGroupState().billingAddressText);

  internalReference = signal('');

  /** Sum of the groups' shipping costs (a single group's cost for non-agents). */
  shippingCost = computed(() =>
    this.groupViews().reduce((sum, { state }) => sum + state.shippingCost, 0)
  );
  isLoadingShipping = computed(() => this.groupViews().some(({ state }) => state.loading));
  // True when any group's delivery cost could not be calculated. We must NOT show
  // €0 (it understates the total) and must block order placement until resolved.
  deliveryCostError = computed(() => this.groupViews().some(({ state }) => state.error));

  /**
   * All required selections are present. Mirrors the fields sent by onPlaceOrder
   * (a shipping address per group, payment type, delivery type) plus a non-empty
   * cart and a successfully calculated shipping cost for every group.
   */
  isCheckoutValid = computed(() =>
    this.cartItems().length > 0 &&
    this.selectedPaymentTypeId() != null &&
    this.selectedDeliveryTypeId() != null &&
    this.groupViews().every(({ state }) =>
      state.selectedShippingAddressId != null &&
      state.shippingAddressText.trim().length > 0 &&
      !state.error &&
      !state.loading
    )
  );

  itemCount = computed(() => this.cartItems().reduce((sum, item) => sum + item.quantity, 0));

  totalWeight = computed(() => this.weightOf(this.cartItems()));

  subtotal = computed(() => this.subtotalOf(this.cartItems()));

  /**
   * Tax is charged at the rate of each group's shipping country on that group's
   * subtotal (rounded to cents per group, as the single-address flow always did).
   */
  estimatedTax = computed(() => {
    const tax = this.groupViews().reduce((sum, { group, state }) => {
      if (state.taxPercent <= 0) return sum;
      return sum + Math.round(this.subtotalOf(group.items) * state.taxPercent / 100 * 100) / 100;
    }, 0);
    return Math.round(tax * 100) / 100;
  });

  /** Shows the rate when every taxed group shares it; mixed rates fall back to plain "Tax". */
  taxLabel = computed(() => {
    const rates = new Set(this.groupViews().map(({ state }) => state.taxPercent).filter(rate => rate > 0));
    return rates.size === 1 ? `Tax (${[...rates][0]}%)` : 'Tax';
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

  /** Shipping weight (kg) of a set of lines — the delivery cost is priced per group. */
  weightOf(items: CheckoutItem[]): number {
    return items.reduce((sum, item) => {
      const weight = this.deliveryCostService.parseWeight(item.product.weight);
      return sum + (weight * item.quantity);
    }, 0);
  }

  private subtotalOf(items: CheckoutItem[]): number {
    return items.reduce((sum, item) => sum + this.getItemTotal(item), 0);
  }

  onQuantityChange(item: CheckoutItem, quantity: number): void {
    this.cartService.updateQuantity(item.id, quantity);
    this.recalculateDeliveryCost(item);
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
    this.recalculateDeliveryCost(item);
  }

  /** Re-prices delivery for the group the changed line belongs to (its weight changed). */
  private recalculateDeliveryCost(item: CheckoutItem): void {
    const groupId = this.isAgent ? (item.clientId ?? OWN_COMPANY_GROUP) : OWN_COMPANY_GROUP;
    this.calculateGroupDeliveryCost(groupId);
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
    for (const group of this.checkoutGroups()) {
      this.loadGroupAddresses(group.clientId);
    }
    this.loadPaymentTypes();
    this.loadDeliveryTypes();
  }

  /**
   * Loads one group's addresses. The own-company group resolves to the logged-in
   * user's client; an agent's client groups to the managed client (the API serves
   * a managed client's addresses to its agent). Defaults the shipping address to
   * the first active delivery address, which also prices the group's delivery.
   */
  private loadGroupAddresses(groupId: number): void {
    const clientId = groupId === OWN_COMPANY_GROUP
      ? this.authService.getCurrentUser()?.client?.id
      : groupId;
    if (!clientId) {
      this.patchGroupState(groupId, { loading: false });
      return;
    }

    this.patchGroupState(groupId, { loading: true });
    this.addressService.getAddressesByClient(clientId).subscribe({
      next: (addresses) => {
        const billing = addresses.find(a => a.isBilling && a.isActive);
        // Multiple delivery addresses are allowed; the user picks one per group.
        const deliveryAddresses = addresses.filter(a => a.isDelivery && a.isActive);
        this.patchGroupState(groupId, {
          addresses: deliveryAddresses,
          billingAddressId: billing?.id ?? null,
          billingAddressText: billing ? this.addressService.formatAddress(billing) : ''
        });

        if (deliveryAddresses.length > 0) {
          this.applyShippingAddress(groupId, deliveryAddresses[0]);
        } else {
          this.patchGroupState(groupId, { loading: false });
        }
      },
      error: (err) => {
        // Without this the spinner ("...") would stick forever on failure.
        console.error('Failed to load shipping addresses:', err);
        this.patchGroupState(groupId, { loading: false });
        this.notification.error('Could not load your addresses. Please try again.');
      }
    });
  }

  /** Shipping address picked for a group (the own-company group by default). */
  onShippingAddressChange(addressId: number | string, groupId: number = OWN_COMPANY_GROUP): void {
    const id = Number(addressId);
    const address = this.groupStates()[groupId]?.addresses.find(a => a.id === id);
    if (address) {
      this.applyShippingAddress(groupId, address);
    }
  }

  formatAddressOption(addr: ClientAddress): string {
    return this.addressService.formatAddress(addr);
  }

  private applyShippingAddress(groupId: number, address: ClientAddress): void {
    const taxPercent = address.country?.taxType?.percent;
    const countryId = address.country?.id ?? null;
    this.patchGroupState(groupId, {
      selectedShippingAddressId: address.id,
      shippingAddressText: this.addressService.formatAddress(address),
      taxPercent: taxPercent ? parseFloat(taxPercent) : 0,
      countryId
    });
    if (countryId) {
      this.calculateGroupDeliveryCost(groupId);
    } else {
      this.patchGroupState(groupId, { loading: false });
    }
  }

  private patchGroupState(groupId: number, patch: Partial<GroupCheckoutState>): void {
    this.groupStates.update(states => ({
      ...states,
      [groupId]: { ...(states[groupId] ?? PENDING_GROUP_STATE), ...patch }
    }));
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

  /** Prices delivery of one group: its shipping country × the weight of its own lines. */
  private calculateGroupDeliveryCost(groupId: number): void {
    const countryId = this.groupStates()[groupId]?.countryId;
    const group = this.checkoutGroups().find(g => g.clientId === groupId);
    if (!countryId || !group) {
      return;
    }

    const weight = this.weightOf(group.items);
    this.patchGroupState(groupId, { loading: true });
    this.deliveryCostService.calculateDeliveryCost(countryId, weight).subscribe({
      next: (result) => {
        // Do not display the fallback €0 — flag the failure so the summary
        // shows "unavailable" and order placement is blocked.
        this.patchGroupState(groupId, result.error
          ? { error: true, shippingCost: 0, loading: false }
          : { error: false, shippingCost: result.totalShippingCost, loading: false });
      },
      error: (err) => {
        console.error('Failed to calculate delivery cost:', err);
        this.patchGroupState(groupId, { error: true, loading: false });
      }
    });
  }

  formatDiscount(discount: number): string {
    return `-${discount}%`;
  }

  onPlaceOrder(): void {
    if (this.isPlacingOrder() || this.cartItems().length === 0) {
      return;
    }

    // Guard against placing an order with missing required selections or an
    // uncalculated shipping cost, even if the button somehow gets triggered.
    if (!this.isCheckoutValid()) {
      const message = this.deliveryCostError()
        ? 'Shipping cost could not be calculated. Please review your delivery address before placing the order.'
        : this.isAgent
          ? 'Please select a shipping address for every client, a payment type and a delivery type before placing the order.'
          : 'Please select a shipping address, payment type and delivery type before placing the order.';
      this.notification.error(message);
      this.orderError.set(message);
      return;
    }

    this.isPlacingOrder.set(true);
    this.orderError.set(null);

    const onSuccess = (queryParams: Params) => {
      this.cartService.clearCart();
      this.isPlacingOrder.set(false);
      this.router.navigate(['/customer/shop/order-success'], { queryParams });
    };
    const onError = (error: unknown) => this.handleOrderError(error, 'Failed to place order. Please try again.');

    if (this.isAgent) {
      // One order per client group, created atomically by the batch endpoint.
      this.orderService.checkout(this.buildCheckoutPayload(false)).subscribe({
        next: ({ orders, checkoutReference }) => onSuccess({
          orderNumbers: orders.map(o => o.orderNumber || o.id).join(','),
          checkoutReference
        }),
        error: onError
      });
    } else {
      this.orderService.createOrder(this.buildOrderData(false)).subscribe({
        next: (order) => onSuccess({ orderNumber: order.orderNumber || order.id }),
        error: onError
      });
    }
  }

  /** Surfaces the backend's reason (e.g. purchase limit exceeded) when present. */
  private handleOrderError(error: unknown, fallback: string): void {
    console.error(fallback, error);
    const err = error as { error?: { detail?: string; message?: string } } | null;
    const detail = err?.error?.detail || err?.error?.message;
    const message = detail || fallback;
    this.orderError.set(message);
    this.notification.error(message);
    this.isPlacingOrder.set(false);
  }

  /** Single-order payload (non-agents) for POST /api/v1/orders. */
  private buildOrderData(isDraft: boolean): Record<string, unknown> {
    return {
      customerReference: this.internalReference().trim() || null,
      items: this.cartItems().map(item => this.toOrderItem(item)),
      isDraft,
      billingAddress: this.billingAddress(),
      shippingAddress: this.shippingAddress(),
      shippingAddressId: this.selectedShippingAddressId(),
      paymentType: this.paymentTypeIri(),
      deliveryType: this.deliveryTypeIri(),
      onBehalfOfClient: this.orderLevelOnBehalfOfIri()
    };
  }

  /**
   * Agent batch payload for POST /api/v1/orders/checkout: one group per managed
   * client (own-company lines under onBehalfOfClient: null), each with the
   * shipping/billing address picked for it.
   */
  private buildCheckoutPayload(isDraft: boolean): CheckoutPayload {
    return {
      isDraft,
      customerReference: this.internalReference().trim() || null,
      notes: null,
      paymentType: this.paymentTypeIri(),
      deliveryType: this.deliveryTypeIri(),
      groups: this.groupViews().map(({ group, state }) => ({
        onBehalfOfClient: group.clientId === OWN_COMPANY_GROUP ? null : `/api/v1/clients/${group.clientId}`,
        shippingAddressId: state.selectedShippingAddressId,
        billingAddressId: state.billingAddressId,
        items: group.items.map(item => ({
          product: `/api/v1/products/${item.product.id}`,
          quantity: item.quantity
        }))
      }))
    };
  }

  private paymentTypeIri(): string | null {
    const id = this.selectedPaymentTypeId();
    return id ? `/api/v1/payment_types/${id}` : null;
  }

  private deliveryTypeIri(): string | null {
    const id = this.selectedDeliveryTypeId();
    return id ? `/api/v1/delivery_types/${id}` : null;
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

    const onSuccess = () => {
      this.cartService.clearCart();
      this.isPlacingOrder.set(false);
      this.router.navigate(['/customer/shop/products']);
    };
    const onError = (error: unknown) => this.handleOrderError(error, 'Failed to save draft. Please try again.');

    // Drafts don't require addresses; whatever is selected per group is sent along.
    if (this.isAgent) {
      this.orderService.checkout(this.buildCheckoutPayload(true)).subscribe({ next: onSuccess, error: onError });
    } else {
      this.orderService.createOrder(this.buildOrderData(true)).subscribe({ next: onSuccess, error: onError });
    }
  }
}
