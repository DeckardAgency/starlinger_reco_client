import { Injectable, signal } from '@angular/core';
import { WishlistItem } from '@core/models/wishlist.model';

const STORAGE_KEY = 'wishlist_items';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private _isWishlistOpen = signal(false);
  private _wishlistItems = signal<WishlistItem[]>(this.loadFromStorage());

  readonly isWishlistOpen = this._isWishlistOpen.asReadonly();
  readonly wishlistItems = this._wishlistItems.asReadonly();

  get itemCount(): number {
    return this._wishlistItems().length;
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

    // Already in wishlist — no-op
    if (existingItem) {
      return;
    }

    this._wishlistItems.update(items => [
      ...items,
      {
        ...item,
        id: Date.now(),
        quantity,
        isFavorite: true
      }
    ]);
    this.saveToStorage();
  }

  updateQuantity(itemId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(itemId);
      return;
    }

    this._wishlistItems.update(items =>
      items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
    this.saveToStorage();
  }

  removeItem(itemId: number): void {
    this._wishlistItems.update(items => items.filter(item => item.id !== itemId));
    this.saveToStorage();
  }

  clearWishlist(): void {
    this._wishlistItems.set([]);
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._wishlistItems()));
    } catch { /* storage unavailable */ }
  }

  private loadFromStorage(): WishlistItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}
