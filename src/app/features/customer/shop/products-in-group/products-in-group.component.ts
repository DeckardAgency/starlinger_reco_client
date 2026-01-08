import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { BreadcrumbsComponent, BreadcrumbItem } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { ToastComponent } from '@app/ui-kit/molecules/toast/toast.component';
import { CartService } from '@core/services/cart.service';
import { WishlistService } from '@core/services/wishlist.service';
import { mockShopProducts, mockProductGroups, mockProductGroupsExtended, ShopProduct } from '@core/mocks/mock-data';

interface ProductDetail extends ShopProduct {
  technicalDescription?: string;
}

@Component({
  selector: 'app-products-in-group',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbsComponent,
    ToastComponent
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

  // Group info
  groupId = signal<string>('');
  groupName = signal<string>('');

  // View mode: 'grid' or 'list'
  viewMode = signal<'grid' | 'list'>('grid');

  // Search and filter
  searchQuery = signal('');
  selectedGroups = signal<string[]>([]);
  isFilterOpen = signal(false);

  // Selected product for detail view
  selectedProduct = signal<ProductDetail | null>(null);
  quantity = signal(1);

  // Toast
  showToast = signal(false);

  // Data from mock
  products = signal<ShopProduct[]>(mockShopProducts);
  productGroups = mockProductGroups;
  productGroupsExtended = mockProductGroupsExtended;

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
        // Find group name from extended groups
        const group = this.productGroupsExtended.find(g => g.id === id);
        if (group) {
          this.groupName.set(group.name);
          // Pre-filter by this group
          this.selectedGroups.set([id]);
        }
      }
    });
  }

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

    // Always filter by current group (and additional filters if any)
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

