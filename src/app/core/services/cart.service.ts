import { Injectable, signal } from '@angular/core';
import { ShopProduct } from '@core/mocks/mock-data';

export interface CartItem {
  id: string;
  product: ShopProduct;
  quantity: number;
  isFavorite: boolean;
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
    const existingItem = this._cartItems().find(item => item.product.id === product.id);

    if (existingItem) {
      this._cartItems.update(items =>
        items.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      this._cartItems.update(items => [
        ...items,
        {
          id: `cart-${product.id}`,
          product,
          quantity,
          isFavorite: false
        }
      ]);
    }
    this.saveToStorage();
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
