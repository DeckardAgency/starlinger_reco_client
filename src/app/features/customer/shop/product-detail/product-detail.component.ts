import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { BreadcrumbsComponent, BreadcrumbItem } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { ToastComponent } from '@app/ui-kit/molecules/toast/toast.component';
import { CartService } from '@core/services/cart.service';
import { mockShopProducts, ShopProduct } from '@core/mocks/mock-data';

interface ProductDetail extends ShopProduct {
  technicalDescription?: string;
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbsComponent,
    ToastComponent
  ],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailComponent {
  private cartService = inject(CartService);

  product = signal<ProductDetail | null>(null);
  quantity = signal(1);
  currentImageIndex = signal(0);
  showToast = signal(false);
  
  // Related products
  relatedProducts = signal<ShopProduct[]>([]);

  breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const prod = this.product();
    return [
      { label: 'Shop', route: '/customer/shop' },
      { label: 'All machines', route: '/customer/shop/products' },
      { label: prod?.name || 'Product' }
    ];
  });

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loadProduct();
  }

  private loadProduct(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      const found = mockShopProducts.find(p => p.id === productId);
      if (found) {
        this.product.set({
          ...found,
          technicalDescription: '0-400mbar, G1/2", 11-30V DC_PMC11-AA1U1FBWBJA'
        });
        // Get related products (excluding current)
        this.relatedProducts.set(
          mockShopProducts.filter(p => p.id !== productId).slice(0, 4)
        );
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/customer/shop/products']);
  }

  incrementQuantity(): void {
    this.quantity.update(q => q + 1);
  }

  decrementQuantity(): void {
    this.quantity.update(q => Math.max(1, q - 1));
  }

  addToCart(): void {
    const product = this.product();
    if (product) {
      this.cartService.addItem(product, this.quantity());
      this.showToast.set(true);
    }
  }

  addToWishlist(): void {
    const product = this.product();
    if (product) {
      console.log('Add to wishlist:', product);
    }
  }

  toggleFavorite(product: ShopProduct, event: Event): void {
    event.stopPropagation();
    const updated = this.relatedProducts().map(p =>
      p.id === product.id ? { ...p, isFavorite: !p.isFavorite } : p
    );
    this.relatedProducts.set(updated);
  }

  onRelatedProductClick(product: ShopProduct): void {
    this.router.navigate(['/customer/shop/products', product.id]);
    // Reload data for new product
    setTimeout(() => this.loadProduct(), 0);
  }

  previousImage(): void {
    this.currentImageIndex.update(i => Math.max(0, i - 1));
  }

  nextImage(): void {
    this.currentImageIndex.update(i => i + 1);
  }

  formatPrice(price: number): string {
    return `€ ${price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  onToastClosed(): void {
    this.showToast.set(false);
  }

  onViewCart(): void {
    this.showToast.set(false);
    this.cartService.openCart();
  }
}

