import { Injectable, signal } from '@angular/core';
import { ShopProduct } from '@core/mocks/mock-data';
import { Order } from '@core/models/order.model';

export interface CartItem {
  id: string;
  product: ShopProduct;
  quantity: number;
  isFavorite: boolean;
  discountPercent: number;
}

const STORAGE_KEY = 'cart_items';

@Injectable({
  providedIn: 'root'
})
export class CartService {
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

  addItem(product: ShopProduct, quantity: number = 1): void {
    // If the product has a qtyStep, ensure quantity is at least one step
    // and is rounded up to the nearest multiple
    const step = product.qtyStep || 1;
    const normalizedQty = this.roundUpToStep(Math.max(quantity, step), step);

    const existingItem = this._cartItems().find(item => item.product.id === product.id);

    if (existingItem) {
      this._cartItems.update(items =>
        items.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: this.roundUpToStep(item.quantity + normalizedQty, step) }
            : item
        )
      );
    } else {
      this._cartItems.update(items => [
        ...items,
        {
          id: `cart-${product.id}`,
          product,
          quantity: normalizedQty,
          isFavorite: false,
          discountPercent: product.discountPercent || 0
        }
      ]);
    }
    this.saveToStorage();
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
      items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
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
    const items: CartItem[] = (order.items || []).map(item => ({
      id: `cart-${item.product.id}`,
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
      discountPercent: 0
    }));
    this._cartItems.set(items);
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._cartItems()));
    } catch { /* storage unavailable */ }
  }

  private loadFromStorage(): CartItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}
