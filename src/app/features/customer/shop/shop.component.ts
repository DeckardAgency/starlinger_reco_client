import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
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
import { AuthService } from '@core/auth/auth.service';
import { USER_ROLES } from '@core/models/auth.model';
import { AgentClientSelectComponent } from './agent-client-select/agent-client-select.component';
import { ShopProduct } from '@core/models/shop-product.model';
import { Product, ProductGroup } from '@core/models';
import { environment } from '@env/environment';

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
    IconComponent,
    AgentClientSelectComponent
  ],
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShopComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scrollSentinel') scrollSentinel!: ElementRef<HTMLDivElement>;
  @ViewChild('productsContainer') productsContainer!: ElementRef<HTMLDivElement>;
  private observer: IntersectionObserver | null = null;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private router: Router;
  private productService = inject(ProductService);
  private productGroupService = inject(ProductGroupService);

  // View mode: 'grid' or 'list'
  viewMode = signal<'grid' | 'list'>('list');

  // Search and filter
  searchQuery = signal('');
  private searchSubject = new Subject<string>();
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
  selectedProduct = signal<ShopProduct | null>(null);
  quantity = signal(1);
  
  // Computed carousel slides for selected product
  selectedProductImages = computed<CarouselSlide[]>(() => {
    const product = this.selectedProduct();
    if (!product) return [];

    // Use real imageGallery if available
    if (product.imageGallery && product.imageGallery.length > 0) {
      return product.imageGallery.map((img, i) => ({
        id: img.id,
        imageUrl: `${environment.apiBaseUrl}${img.filePath}`,
        alt: `${product.name} - ${i + 1}`
      }));
    }

    // Fallback to featured image
    return [{ id: 1, imageUrl: product.image, alt: product.name }];
  });

  // Toast
  showToast = signal(false);

  // Cart & Wishlist
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private authService = inject(AuthService);

  /** Client agents see the "ordering for" bar + per-client cart badges. */
  get isAgent(): boolean {
    return this.authService.hasRole(USER_ROLES.CLIENT_AGENT);
  }

  /** Per-client summary of what's currently in the cart (agent flow). */
  cartClientBadges = computed(() => {
    type Badge = {
      clientId: number;
      clientName: string;
      itemCount: number;
      products: { code: string; name: string; quantity: number }[];
    };
    const groups = new Map<number, Badge>();
    for (const item of this.cartService.cartItems()) {
      if (item.clientId == null) continue;
      const g = groups.get(item.clientId)
        ?? { clientId: item.clientId, clientName: item.clientName ?? '', itemCount: 0, products: [] };
      g.itemCount += 1;
      g.products.push({ code: item.product.code, name: item.product.name, quantity: item.quantity });
      groups.set(item.clientId, g);
    }
    return Array.from(groups.values());
  });

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

    // Server-side search with debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.reloadProducts();
    });
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.searchSubject.complete();
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

  private loadData(): void {
    this.isLoading.set(true);
    const query = this.searchQuery() || undefined;

    // Load products and product groups in parallel
    forkJoin({
      products: this.productService.getProducts(1, this.itemsPerPage, query),
      groups: this.productGroupService.getProductGroups()
    }).subscribe({
      next: ({ products, groups }) => {
        const shopProducts = products.member.map(product => this.mapProductToShopProduct(product));
        this.products.set(shopProducts);
        this.totalItems.set(products.totalItems);
        this.currentPage.set(1);

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

  private reloadProducts(): void {
    this.isLoading.set(true);
    const query = this.searchQuery() || undefined;

    this.productService.getProducts(1, this.itemsPerPage, query).subscribe({
      next: (products) => {
        const shopProducts = products.member.map(product => this.mapProductToShopProduct(product));
        this.products.set(shopProducts);
        this.totalItems.set(products.totalItems);
        this.currentPage.set(1);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load products:', error);
        this.isLoading.set(false);
      }
    });
  }

  private loadMore(): void {
    const nextPage = this.currentPage() + 1;
    this.isLoadingMore.set(true);
    const query = this.searchQuery() || undefined;

    this.productService.getProducts(nextPage, this.itemsPerPage, query).subscribe({
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
      isFavorite: this.wishlistService.wishlistItems().some(i => i.productCode === product.partNo),
      group: String(product.productGroupId || ''),
      technicalDescription: product.technicalDescription,
      shortDescription: product.shortDescription,
      weight: product.weight || undefined,
      qtyStep: product.qtyStep ?? null,
      quoteItemLimit: product.quoteItemLimit ?? null,
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
      id: String(group.id),
      label: group.name,
      code: group.productGroupCode
    };
  }

  // Breadcrumb
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Shop' }
  ];

  // Filtered products (search is server-side, only group filtering client-side)
  filteredProducts = computed(() => {
    let result = this.products();
    const groups = this.selectedGroups();

    if (groups.length > 0) {
      result = result.filter(p => groups.includes(p.group));
    }

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
    this.searchSubject.next(value);
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
    // No window on the server; SSR renders the default (desktop) layout
    return this.isBrowser && window.innerWidth <= 576;
  }

  /** Tablet + mobile: navigate to full detail page instead of split panel */
  private isCompactView(): boolean {
    return this.isBrowser && window.innerWidth <= 1024;
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
    // Start at one order step (products with a step can't be bought in smaller amounts)
    this.quantity.set(product.qtyStep || 1);
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
    // addItem returns false when an agent hasn't picked a client yet (it shows
    // its own notification); only surface the success toast when it was added.
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
