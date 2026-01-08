import { Injectable, signal } from '@angular/core';
import { WishlistItem } from '@core/models/wishlist.model';
import { mockWishlistItems } from '@core/mocks/mock-data';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private _isWishlistOpen = signal(false);
  private _wishlistItems = signal<WishlistItem[]>([]);

  readonly isWishlistOpen = this._isWishlistOpen.asReadonly();
  readonly wishlistItems = this._wishlistItems.asReadonly();

  constructor() {
    // Load mock items initially
    this._wishlistItems.set(mockWishlistItems as WishlistItem[]);
  }

  get itemCount(): number {
    return this._wishlistItems().reduce((sum, item) => sum + item.quantity, 0);
  }

  openWishlist(): void {
    this._isWishlistOpen.set(true);
  }

  closeWishlist(): void {
    this._isWishlistOpen.set(false);
  }

  toggleWishlist(): void {
    this._isWishlistOpen.update(v => !v);
  }

  addItem(item: Omit<WishlistItem, 'id'>, quantity: number = 1): void {
    const existingItem = this._wishlistItems().find(i => i.productCode === item.productCode);
    
    if (existingItem) {
      this._wishlistItems.update(items =>
        items.map(i =>
          i.productCode === item.productCode
            ? { ...i, quantity: i.quantity + quantity }
            : i
        )
      );
    } else {
      this._wishlistItems.update(items => [
        ...items,
        {
          ...item,
          id: `wl-${Date.now()}`,
          quantity,
          isFavorite: true
        }
      ]);
    }
  }

  updateQuantity(itemId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(itemId);
      return;
    }

    this._wishlistItems.update(items =>
      items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  }

  removeItem(itemId: string): void {
    this._wishlistItems.update(items => items.filter(item => item.id !== itemId));
  }

  clearWishlist(): void {
    this._wishlistItems.set([]);
  }
}

