import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ShopProduct } from '@core/models/shop-product.model';
import { Order } from '@core/models/order.model';
import { AuthService } from '@core/auth/auth.service';
import { AgentClientSelectionService } from '@core/services/agent-client-selection.service';
import { NotificationService } from '@core/services/notification.service';
import { USER_ROLES } from '@core/models/auth.model';

export interface CartItem {
  id: string;
  product: ShopProduct;
  quantity: number;
  isFavorite: boolean;
  discountPercent: number;
  // Client-agent flow: the managed client this line is ordered on behalf of.
  clientId?: number;
  clientName?: string;
  clientCode?: string;
}

const STORAGE_KEY = 'cart_items';
// Hard ceiling per cart line — keeps typos (e.g. an extra digit) from producing
// million-piece orders; matches the quantity selector's maximum.
const MAX_LINE_QTY = 999999;

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private auth = inject(AuthService);
  private agentSelection = inject(AgentClientSelectionService);
  private notification = inject(NotificationService);
  // Must be initialized before _cartItems: loadFromStorage() depends on it.
  // localStorage does not exist during SSR — reads/writes are explicit no-ops there.
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private _isCartOpen = signal(false);
  private _cartItems = signal<CartItem[]>(this.loadFromStorage());

  readonly isCartOpen = this._isCartOpen.asReadonly();
  readonly cartItems = this._cartItems.asReadonly();

  get itemCount(): number {
    return this._cartItems().reduce((sum, item) => sum + item.quantity, 0);
  }

  openCart(): void {
    this._isCartOpen.set(true);
  }

  closeCart(): void {
    this._isCartOpen.set(false);
  }

  toggleCart(): void {
    this._isCartOpen.update(v => !v);
  }

  /** Whether the current user is a client agent (orders on behalf of managed clients). */
  isAgentUser(): boolean {
    return this.auth.hasRole(USER_ROLES.CLIENT_AGENT);
  }

  /**
   * Add a product to the cart. For client agents, the currently-selected managed
   * client is stamped onto the line (and a selection is mandatory). Lines are
   * de-duplicated by product AND client, so the same product for two clients
   * becomes two separate lines.
   *
   * @returns true if added, false if blocked (agent with no client selected).
   */
  addItem(product: ShopProduct, quantity: number = 1): boolean {
    const client = this.agentSelection.getSelectedClient();

    // Agents must pick a client before adding anything to the cart.
    if (this.isAgentUser() && !client) {
      this.notification.warning('Please select a client before adding products to cart.');
      return false;
    }

    // If the product has a qtyStep, ensure quantity is at least one step
    // and is rounded up to the nearest multiple
    const step = product.qtyStep || 1;
    const normalizedQty = Math.min(this.roundUpToStep(Math.max(quantity, step), step), MAX_LINE_QTY);

    const clientId = client?.id;
    const existingItem = this._cartItems().find(
      item => item.product.id === product.id && item.clientId === clientId
    );

    if (existingItem) {
      this._cartItems.update(items =>
        items.map(item =>
          item.id === existingItem.id
            ? { ...item, quantity: Math.min(this.roundUpToStep(item.quantity + normalizedQty, step), MAX_LINE_QTY) }
            : item
        )
      );
    } else {
      this._cartItems.update(items => [
        ...items,
        {
          id: `cart-${product.id}-${clientId ?? 'self'}`,
          product,
          quantity: normalizedQty,
          isFavorite: false,
          discountPercent: product.discountPercent || 0,
          ...(client ? { clientId: client.id, clientName: client.name, clientCode: client.code } : {})
        }
      ]);
    }
    this.saveToStorage();
    return true;
  }

  private roundUpToStep(value: number, step: number): number {
    if (step <= 1) return value;
    const remainder = value % step;
    return remainder === 0 ? value : value + (step - remainder);
  }

  updateQuantity(itemId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(itemId);
      return;
    }

    this._cartItems.update(items =>
      items.map(item => {
        if (item.id !== itemId) return item;
        const step = item.product.qtyStep || 1;
        const normalized = Math.min(this.roundUpToStep(Math.max(quantity, step), step), MAX_LINE_QTY);
        return { ...item, quantity: normalized };
      })
    );
    this.saveToStorage();
  }

  removeItem(itemId: string): void {
    this._cartItems.update(items => items.filter(item => item.id !== itemId));
    this.saveToStorage();
  }

  toggleFavorite(itemId: string): void {
    this._cartItems.update(items =>
      items.map(item =>
        item.id === itemId ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
    this.saveToStorage();
  }

  clearCart(): void {
    this._cartItems.set([]);
    this.saveToStorage();
  }

  /**
   * Load items from a draft order into the cart, replacing current cart contents.
   */
  loadFromDraft(order: Order): void {
    const items: CartItem[] = (order.items || []).map(item => {
      // Per-item delegation may be present on agent drafts (order:read serializes it).
      const oboc = (item as { onBehalfOfClient?: { id: number; name: string; code: string } }).onBehalfOfClient;
      return {
        id: `cart-${item.product.id}-${oboc?.id ?? 'self'}`,
        product: {
          id: item.product.id,
          code: item.product.partNo || '',
          name: item.product.name || '',
          price: item.unitPrice || item.product.price || 0,
          image: '',
          isFavorite: false,
          group: '',
          qtyStep: item.product.qtyStep ?? null
        },
        quantity: item.quantity,
        isFavorite: false,
        discountPercent: 0,
        ...(oboc ? { clientId: oboc.id, clientName: oboc.name, clientCode: oboc.code } : {})
      };
    });
    this._cartItems.set(items);
    this.saveToStorage();
  }

  private saveToStorage(): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._cartItems()));
    } catch { /* storage unavailable */ }
  }

  private loadFromStorage(): CartItem[] {
    if (!this.isBrowser) {
      return [];
    }
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const items: CartItem[] = data ? JSON.parse(data) : [];
      // Persisted carts may predate the quantity cap — normalize on restore.
      return items.map(item => ({
        ...item,
        quantity: Math.min(Math.max(item.quantity, 1), MAX_LINE_QTY)
      }));
    } catch {
      return [];
    }
  }
}
