import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { WISHLIST_STORAGE_KEY } from '@core/auth/session-storage-keys';
import { WishlistItem } from '@core/models/wishlist.model';

const STORAGE_KEY = WISHLIST_STORAGE_KEY;

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private auth = inject(AuthService);
  // Must be initialized before _wishlistItems: loadFromStorage() depends on it.
  // localStorage does not exist during SSR — reads/writes are explicit no-ops there.
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private _isWishlistOpen = signal(false);
  private _wishlistItems = signal<WishlistItem[]>(this.loadFromStorage());

  readonly isWishlistOpen = this._isWishlistOpen.asReadonly();
  readonly wishlistItems = this._wishlistItems.asReadonly();

  constructor() {
    // The wishlist belongs to the signed-in user: drop it when their session ends (logout,
    // forced logout, idle timeout) so the next person on this browser starts empty.
    (this.auth.sessionEnded$ ?? EMPTY)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.discard());
  }

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

  /** Empty the wishlist in memory and remove (not just blank) its persisted copy. */
  private discard(): void {
    this._wishlistItems.set([]);
    this._isWishlistOpen.set(false);
    if (!this.isBrowser) {
      return;
    }
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* storage unavailable */ }
  }

  private saveToStorage(): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._wishlistItems()));
    } catch { /* storage unavailable */ }
  }

  private loadFromStorage(): WishlistItem[] {
    if (!this.isBrowser) {
      return [];
    }
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}
