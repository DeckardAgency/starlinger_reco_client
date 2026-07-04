import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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
import { ShopProduct } from '@core/models/shop-product.model';
import { Product, ProductGroup } from '@core/models';
import { environment } from '@env/environment';

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
export class ProductsInGroupComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scrollSentinel') scrollSentinel!: ElementRef<HTMLDivElement>;
  @ViewChild('productsContainer') productsContainer!: ElementRef<HTMLDivElement>;
  private observer: IntersectionObserver | null = null;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

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

  // Infinite scroll
  currentPage = signal(1);
  totalItems = signal(0);
  readonly itemsPerPage = 30;
  isLoadingMore = signal(false);
  hasMore = computed(() => this.products().length < this.totalItems());

  // Loading state
  isLoading = signal(true);

  // Selected product for detail view
  selectedProduct = signal<ProductDetail | null>(null);
  quantity = signal(1);
  
  // Computed carousel slides for selected product
  selectedProductImages = computed<CarouselSlide[]>(() => {
    const product = this.selectedProduct();
    if (!product) return [];

    if (product.imageGallery && product.imageGallery.length > 0) {
      return product.imageGallery.map((img, i) => ({
        id: img.id,
        imageUrl: `${environment.apiBaseUrl}${img.filePath}`,
        alt: `${product.name} - ${i + 1}`
      }));
    }

    return [{ id: 1, imageUrl: product.image, alt: product.name }];
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

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private setupIntersectionObserver(): void {
    // IntersectionObserver does not exist on the server
    if (!this.isBrowser) {
      return;
    }
    const root = this.productsContainer?.nativeElement || null;
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && this.hasMore() && !this.isLoadingMore() && !this.isLoading()) {
          this.loadMore();
        }
      },
      { root, threshold: 0.1 }
    );
    if (this.scrollSentinel) {
      this.observer.observe(this.scrollSentinel.nativeElement);
    }
  }

  private loadData(groupId: string): void {
    this.isLoading.set(true);

    // Load group info, all groups for filter, and products in parallel
    forkJoin({
      currentGroup: this.productGroupService.getProductGroupById(groupId),
      allGroups: this.productGroupService.getProductGroups(),
      products: this.productService.getProducts(1, this.itemsPerPage)
    }).subscribe({
      next: ({ currentGroup, allGroups, products }) => {
        this.groupName.set(currentGroup.name);
        this.selectedGroups.set([groupId]);

        const filterGroups = allGroups.member.map(group => this.mapProductGroupToFilterGroup(group));
        this.productGroups.set(filterGroups);

        const shopProducts = products.member.map(product => this.mapProductToShopProduct(product));
        this.products.set(shopProducts);
        this.totalItems.set(products.totalItems);
        this.currentPage.set(1);

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load data:', error);
        this.isLoading.set(false);
      }
    });
  }

  private loadMore(): void {
    const nextPage = this.currentPage() + 1;
    this.isLoadingMore.set(true);

    this.productService.getProducts(nextPage, this.itemsPerPage).subscribe({
      next: (products) => {
        const newProducts = products.member.map(product => this.mapProductToShopProduct(product));
        this.products.update(current => [...current, ...newProducts]);
        this.totalItems.set(products.totalItems);
        this.currentPage.set(nextPage);
        this.isLoadingMore.set(false);
      },
      error: (error) => {
        console.error('Failed to load more products:', error);
        this.isLoadingMore.set(false);
      }
    });
  }

  private mapProductToShopProduct(product: Product): ShopProduct {
    const hasDiscount = product.hasDiscount ?? false;
    const discountPercent = product.campaignDiscountPercent ?? 0;
    const discountedPrice = product.discountedPrice ?? product.price;

    return {
      id: product.id,
      code: product.partNo,
      name: product.name,
      price: product.price,
      image: this.getProductImageUrl(product),
      isFavorite: false,
      group: 'general',
      technicalDescription: product.technicalDescription,
      shortDescription: product.shortDescription,
      weight: product.weight || undefined,
      qtyStep: product.qtyStep ?? null,
      hasDiscount,
      discountPercent,
      discountedPrice,
      imageGallery: (product.imageGallery || []).map(img => ({
        id: img.id,
        filePath: img.filePath,
        filename: img.filename,
        mimeType: img.mimeType
      })),
      documents: (product.documents as any[] || []).map((doc: any) => ({
        id: doc.id,
        filePath: doc.filePath,
        filename: doc.filename,
        mimeType: doc.mimeType
      }))
    };
  }

  private getProductImageUrl(product: Product): string {
    if (product.featuredImage?.filePath) {
      return `${environment.apiBaseUrl}${product.featuredImage.filePath}`;
    }
    return '/images/product-placeholder.svg';
  }

  getDocumentUrl(doc: { filePath: string }): string {
    return `${environment.apiBaseUrl}${doc.filePath}`;
  }

  getDocumentIcon(mimeType: string): string {
    if (mimeType?.includes('pdf')) return 'file-text';
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel') || mimeType?.includes('csv')) return 'file-spreadsheet';
    return 'file';
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

  totalCount = computed(() => this.totalItems());

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
      ...product
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
    // addItem returns false when an agent hasn't selected a client (shows its
    // own notification); only show the success toast when actually added.
    if (product && this.cartService.addItem(product, this.quantity())) {
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
