import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BreadcrumbsComponent, BreadcrumbItem } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { InputComponent } from '@app/ui-kit/atoms/input/input.component';
import { ToastComponent } from '@app/ui-kit/molecules/toast/toast.component';
import { CartService } from '@core/services/cart.service';
import { mockShopProducts, mockProductGroups, ShopProduct } from '@core/mocks/mock-data';

interface ProductDetail extends ShopProduct {
  technicalDescription?: string;
}

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbsComponent,
    InputComponent,
    ToastComponent
  ],
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShopComponent {
  private router: Router;

  // View mode: 'grid' or 'list'
  viewMode = signal<'grid' | 'list'>('list');

  // Search and filter
  searchQuery = signal('');
  selectedGroups = signal<string[]>([]);
  isFilterOpen = signal(false);

  // Selected product for detail view
  selectedProduct = signal<ProductDetail | null>(null);
  quantity = signal(1);

  // Toast
  showToast = signal(false);

  // Cart
  private cartService = inject(CartService);

  constructor(router: Router) {
    this.router = router;
  }

  // Data from mock
  products = signal<ShopProduct[]>(mockShopProducts);
  productGroups = mockProductGroups;

  // Breadcrumb
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Shop', route: '/customer/shop' },
    { label: 'All products' }
  ];

  // Filtered products
  filteredProducts = computed(() => {
    let result = this.products();
    const query = this.searchQuery().toLowerCase();
    const groups = this.selectedGroups();

    if (query) {
      result = result.filter(p =>
        p.code.toLowerCase().includes(query) ||
        p.name.toLowerCase().includes(query)
      );
    }

    if (groups.length > 0) {
      result = result.filter(p => groups.includes(p.group));
    }

    return result;
  });

  totalCount = computed(() => this.filteredProducts().length);

  // Get selected group labels for display
  selectedGroupLabels = computed(() => {
    return this.selectedGroups().map(groupId => {
      const group = this.productGroups.find(g => g.id === groupId);
      return { id: groupId, label: group?.label || groupId };
    });
  });

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  toggleFilter(): void {
    this.isFilterOpen.set(!this.isFilterOpen());
  }

  toggleGroup(groupId: string): void {
    const current = this.selectedGroups();
    if (current.includes(groupId)) {
      this.selectedGroups.set(current.filter(id => id !== groupId));
    } else {
      this.selectedGroups.set([...current, groupId]);
    }
  }

  isGroupSelected(groupId: string): boolean {
    return this.selectedGroups().includes(groupId);
  }

  removeFilter(groupId: string): void {
    this.selectedGroups.set(this.selectedGroups().filter(id => id !== groupId));
  }

  clearAllFilters(): void {
    this.selectedGroups.set([]);
    this.isFilterOpen.set(false);
  }

  getFilterButtonLabel(): string {
    const count = this.selectedGroups().length;
    if (count === 0) return 'Filter by product group';
    return `${count} filter${count > 1 ? 's' : ''} selected`;
  }

  toggleFavorite(product: ShopProduct, event: Event): void {
    event.stopPropagation();
    const updated = this.products().map(p =>
      p.id === product.id ? { ...p, isFavorite: !p.isFavorite } : p
    );
    this.products.set(updated);
  }

  formatPrice(price: number): string {
    return `€ ${price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  onProductClick(product: ShopProduct): void {
    // In list view, show detail panel; in grid view, navigate to detail page
    if (this.viewMode() === 'list') {
      this.selectProduct(product);
    } else {
      this.router.navigate(['/customer/shop/products', product.id]);
    }
  }

  selectProduct(product: ShopProduct): void {
    const detail: ProductDetail = {
      ...product,
      technicalDescription: '0-400mbar, G1/2", 11-30V DC_PMC11-AA1U1FBWBJA'
    };
    this.selectedProduct.set(detail);
    this.quantity.set(1);
  }

  closeProductDetail(): void {
    this.selectedProduct.set(null);
  }

  isProductSelected(product: ShopProduct): boolean {
    return this.selectedProduct()?.id === product.id;
  }

  incrementQuantity(): void {
    this.quantity.update(q => q + 1);
  }

  decrementQuantity(): void {
    this.quantity.update(q => Math.max(1, q - 1));
  }

  addToCart(): void {
    const product = this.selectedProduct();
    if (product) {
      this.cartService.addItem(product, this.quantity());
      this.showToast.set(true);
    }
  }

  onToastClosed(): void {
    this.showToast.set(false);
  }

  onViewCart(): void {
    this.showToast.set(false);
    this.cartService.openCart();
  }

  addToWishlist(): void {
    const product = this.selectedProduct();
    if (product) {
      console.log('Add to wishlist:', product);
    }
  }

  trackByProductId(index: number, product: ShopProduct): string {
    return product.id;
  }
}
