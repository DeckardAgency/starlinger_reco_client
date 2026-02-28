import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BreadcrumbsComponent, BreadcrumbItem } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { ToastComponent } from '@app/ui-kit/molecules/toast/toast.component';
import { QuantitySelectorComponent } from '@app/ui-kit/molecules/quantity-selector/quantity-selector.component';
import { CarouselComponent, CarouselSlide } from '@app/ui-kit/molecules/carousel/carousel.component';
import { EmptyStateComponent } from '@app/ui-kit/molecules/empty-state/empty-state.component';
import { FavoriteButtonComponent } from '@app/ui-kit/atoms/favorite-button/favorite-button.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { CartService } from '@core/services/cart.service';
import { WishlistService } from '@core/services/wishlist.service';
import { ProductService } from '@core/services/http/product.service';
import { ProductGroupService } from '@core/services/http/product-group.service';
import { ShopProduct } from '@core/mocks/mock-data';
import { Product, ProductGroup } from '@core/models';

// Filter group interface for UI
interface FilterGroup {
  id: string;
  label: string;
  code: string;
}


@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbsComponent,
    ToastComponent,
    QuantitySelectorComponent,
    CarouselComponent,
    EmptyStateComponent,
    FavoriteButtonComponent,
    IconComponent
  ],
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShopComponent implements OnInit {
  private router: Router;
  private productService = inject(ProductService);
  private productGroupService = inject(ProductGroupService);

  // View mode: 'grid' or 'list'
  viewMode = signal<'grid' | 'list'>('list');

  // Search and filter
  searchQuery = signal('');
  selectedGroups = signal<string[]>([]);
  isFilterOpen = signal(false);

  // Loading state
  isLoading = signal(true);

  // Selected product for detail view
  selectedProduct = signal<ShopProduct | null>(null);
  quantity = signal(1);
  
  // Computed carousel slides for selected product
  selectedProductImages = computed<CarouselSlide[]>(() => {
    const product = this.selectedProduct();
    if (!product) return [];
    return [
      { id: 1, imageUrl: product.image, alt: product.name },
      { id: 2, imageUrl: product.image, alt: `${product.name} - View 2` },
      { id: 3, imageUrl: product.image, alt: `${product.name} - View 3` }
    ];
  });

  // Toast
  showToast = signal(false);

  // Cart & Wishlist
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);

  constructor(router: Router) {
    this.router = router;
  }

  // Products and groups loaded from API
  products = signal<ShopProduct[]>([]);
  productGroups = signal<FilterGroup[]>([]);

  ngOnInit(): void {
    if (this.isMobile()) {
      this.viewMode.set('list');
    }
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    
    // Load products and product groups in parallel
    forkJoin({
      products: this.productService.getProducts(),
      groups: this.productGroupService.getProductGroups()
    }).subscribe({
      next: ({ products, groups }) => {
        // Map products
        const shopProducts = products.member.map(product => this.mapProductToShopProduct(product));
        this.products.set(shopProducts);
        
        // Map groups for filter UI
        const filterGroups = groups.member.map(group => this.mapProductGroupToFilterGroup(group));
        this.productGroups.set(filterGroups);
        
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load data:', error);
        this.isLoading.set(false);
      }
    });
  }

  private mapProductToShopProduct(product: Product): ShopProduct {
    return {
      id: product.id,
      code: product.partNo,
      name: product.name,
      price: product.price,
      image: this.getProductImageUrl(product),
      isFavorite: this.wishlistService.wishlistItems().some(i => i.productCode === product.partNo),
      group: String(product.productGroupId || ''),
      technicalDescription: product.technicalDescription,
      shortDescription: product.shortDescription
    };
  }

  private getProductImageUrl(product: Product): string {
    // Use placeholder with product name - images don't exist in dev environment
    const encodedName = encodeURIComponent(product.shortDescription || product.name);
    return `https://placehold.co/200x200/f5f5f5/666?text=${encodedName}`;
  }

  private mapProductGroupToFilterGroup(group: ProductGroup): FilterGroup {
    return {
      id: String(group.id),
      label: group.name,
      code: group.productGroupCode
    };
  }

  // Breadcrumb
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Shop' }
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
    const groups = this.productGroups();
    return this.selectedGroups().map(groupId => {
      const group = groups.find(g => g.id === groupId);
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
    this.onFavoriteToggle(product);
  }

  onFavoriteToggle(product: ShopProduct): void {
    const wasInWishlist = product.isFavorite;
    const updated = this.products().map(p =>
      p.id === product.id ? { ...p, isFavorite: !p.isFavorite } : p
    );
    this.products.set(updated);

    if (!wasInWishlist) {
      this.wishlistService.addItem({
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        imageUrl: product.image,
        price: product.price,
        quantity: 1,
        isFavorite: true
      });
    } else {
      const wishlistItem = this.wishlistService.wishlistItems().find(i => i.productCode === product.code);
      if (wishlistItem) {
        this.wishlistService.removeItem(wishlistItem.id);
      }
    }
  }

  formatPrice(price: number): string {
    return `€ ${price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  private isMobile(): boolean {
    return window.innerWidth <= 576;
  }

  /** Tablet + mobile: navigate to full detail page instead of split panel */
  private isCompactView(): boolean {
    return window.innerWidth <= 1024;
  }

  onProductClick(product: ShopProduct): void {
    if (this.isCompactView()) {
      this.router.navigate(['/customer/shop/products', product.id]);
      return;
    }
    // In list view, show detail panel; in grid view, navigate to detail page
    if (this.viewMode() === 'list') {
      this.selectProduct(product);
    } else {
      this.router.navigate(['/customer/shop/products', product.id]);
    }
  }

  onArrowClick(product: ShopProduct, event: Event): void {
    event.stopPropagation();
    if (this.isCompactView()) {
      this.router.navigate(['/customer/shop/products', product.id]);
    } else {
      this.selectProduct(product);
    }
  }

  selectProduct(product: ShopProduct): void {
    this.selectedProduct.set(product);
    this.quantity.set(1);
  }

  closeShopProduct(): void {
    this.selectedProduct.set(null);
  }

  isProductSelected(product: ShopProduct): boolean {
    return this.selectedProduct()?.id === product.id;
  }

  onQuantityChange(value: number): void {
    this.quantity.set(value);
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
      this.wishlistService.addItem({
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        imageUrl: product.image,
        price: product.price,
        quantity: 1,
        isFavorite: true
      });
      // Mark as favorite in the product list too
      const updated = this.products().map(p =>
        p.id === product.id ? { ...p, isFavorite: true } : p
      );
      this.products.set(updated);
    }
  }

  trackByProductId(index: number, product: ShopProduct): number {
    return product.id;
  }
}
