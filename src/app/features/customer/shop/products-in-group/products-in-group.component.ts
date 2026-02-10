import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BreadcrumbsComponent, BreadcrumbItem } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { ToastComponent } from '@app/ui-kit/molecules/toast/toast.component';
import { QuantitySelectorComponent } from '@app/ui-kit/molecules/quantity-selector/quantity-selector.component';
import { CarouselComponent, CarouselSlide } from '@app/ui-kit/molecules/carousel/carousel.component';
import { FavoriteButtonComponent } from '@app/ui-kit/atoms/favorite-button/favorite-button.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { CartService } from '@core/services/cart.service';
import { WishlistService } from '@core/services/wishlist.service';
import { ProductService } from '@core/services/http/product.service';
import { ProductGroupService } from '@core/services/http/product-group.service';
import { ShopProduct } from '@core/mocks/mock-data';
import { Product, ProductGroup } from '@core/models';

interface ProductDetail extends ShopProduct {
  technicalDescription?: string;
}

// Filter group interface for UI
interface FilterGroup {
  id: string;
  label: string;
  code: string;
}

@Component({
  selector: 'app-products-in-group',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbsComponent,
    ToastComponent,
    QuantitySelectorComponent,
    CarouselComponent,
    FavoriteButtonComponent,
    IconComponent
  ],
  templateUrl: './products-in-group.component.html',
  styleUrls: ['./products-in-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsInGroupComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private productService = inject(ProductService);
  private productGroupService = inject(ProductGroupService);

  // Group info
  groupId = signal<string>('');
  groupName = signal<string>('');

  // View mode: 'grid' or 'list'
  viewMode = signal<'grid' | 'list'>('grid');

  // Search and filter
  searchQuery = signal('');
  selectedGroups = signal<string[]>([]);
  isFilterOpen = signal(false);

  // Loading state
  isLoading = signal(true);

  // Selected product for detail view
  selectedProduct = signal<ProductDetail | null>(null);
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

  // Data loaded from API
  products = signal<ShopProduct[]>([]);
  productGroups = signal<FilterGroup[]>([]);

  // Breadcrumb (computed based on group)
  breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    { label: 'Shop', route: '/customer/shop/groups' },
    { label: this.groupName() || 'Products' }
  ]);

  ngOnInit(): void {
    // Get group ID from route params
    this.route.paramMap.subscribe(params => {
      const id = params.get('groupId');
      if (id) {
        this.groupId.set(id);
        this.loadData(id);
      }
    });
  }

  private loadData(groupId: string): void {
    this.isLoading.set(true);

    // Load group info, all groups for filter, and products in parallel
    forkJoin({
      currentGroup: this.productGroupService.getProductGroupById(groupId),
      allGroups: this.productGroupService.getProductGroups(),
      products: this.productService.getProducts()
    }).subscribe({
      next: ({ currentGroup, allGroups, products }) => {
        // Set current group info
        this.groupName.set(currentGroup.name);
        this.selectedGroups.set([groupId]);

        // Map all groups for filter UI
        const filterGroups = allGroups.member.map(group => this.mapProductGroupToFilterGroup(group));
        this.productGroups.set(filterGroups);

        // Map products (TODO: filter by group when API supports it)
        const shopProducts = products.member.map(product => this.mapProductToShopProduct(product));
        this.products.set(shopProducts);

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
      isFavorite: false,
      group: 'general' // TODO: map from product.productGroup when relation exists
    };
  }

  private getProductImageUrl(product: Product): string {
    // Use placeholder with product name - images don't exist in dev environment
    const encodedName = encodeURIComponent(product.shortDescription || product.name);
    return `https://placehold.co/200x200/f5f5f5/666?text=${encodedName}`;
  }

  private mapProductGroupToFilterGroup(group: ProductGroup): FilterGroup {
    return {
      id: group.id,
      label: group.name,
      code: group.productGroupCode
    };
  }

  // Filtered products
  filteredProducts = computed(() => {
    let result = this.products();
    const query = this.searchQuery().toLowerCase();

    if (query) {
      result = result.filter(p =>
        p.code.toLowerCase().includes(query) ||
        p.name.toLowerCase().includes(query)
      );
    }

    // Note: Group filtering is handled by API when supported
    // For now, show all products as groups aren't linked to products yet

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
    // Keep the main group, clear others
    this.selectedGroups.set([this.groupId()]);
    this.isFilterOpen.set(false);
  }

  getFilterButtonLabel(): string {
    const count = this.selectedGroups().length;
    if (count === 0) return 'Filter by product group';
    if (count === 1) return this.groupName() || 'Filter by product group';
    return `${count} filters selected`;
  }

  toggleFavorite(product: ShopProduct, event: Event): void {
    event.stopPropagation();
    this.onFavoriteToggle(product);
  }

  onFavoriteToggle(product: ShopProduct): void {
    const updated = this.products().map(p =>
      p.id === product.id ? { ...p, isFavorite: !p.isFavorite } : p
    );
    this.products.set(updated);

    // Also update in wishlist service if favorited
    if (!product.isFavorite) {
      this.wishlistService.addItem({
        productCode: product.code,
        productName: product.name,
        imageUrl: product.image,
        price: product.price,
        quantity: 1,
        isFavorite: true
      });
    } else {
      this.wishlistService.removeItem(product.id);
    }
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

  onQuantityChange(value: number): void {
    this.quantity.set(value);
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
      this.wishlistService.addItem({
        productCode: product.code,
        productName: product.name,
        imageUrl: product.image,
        price: product.price,
        quantity: 1,
        isFavorite: true
      });
    }
  }

  trackByProductId(index: number, product: ShopProduct): string {
    return product.id;
  }
}
