import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { ShopProduct } from '@core/mocks/mock-data';
import { Product } from '@core/models';
import { environment } from '@env/environment';

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
    ToastComponent,
    QuantitySelectorComponent,
    CarouselComponent,
    FavoriteButtonComponent,
    IconComponent
  ],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailComponent implements OnInit {
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private productService = inject(ProductService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  product = signal<ProductDetail | null>(null);
  quantity = signal(1);
  showToast = signal(false);
  isLoading = signal(true);
  
  // Image carousel slides
  productImages = signal<CarouselSlide[]>([]);
  
  // Related products
  relatedProducts = signal<ShopProduct[]>([]);

  breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const prod = this.product();
    return [
      { label: 'Shop', route: '/customer/shop' },
      { label: prod?.name || 'Product' }
    ];
  });

  ngOnInit(): void {
    // Subscribe to route params to handle navigation between products
    this.route.paramMap.subscribe(params => {
      const productId = params.get('id');
      if (productId) {
        this.loadProduct(productId);
      }
    });
  }

  private loadProduct(productId: string): void {
    this.isLoading.set(true);

    // Load the product and related products
    forkJoin({
      productResponse: this.productService.getProductById(productId),
      allProducts: this.productService.getProducts()
    }).subscribe({
      next: ({ productResponse, allProducts }) => {
        // Check if product was found
        if (!productResponse) {
          console.error('Product not found:', productId);
          this.isLoading.set(false);
          return;
        }
        
        // Map to ProductDetail
        this.product.set(this.mapProductToDetail(productResponse));
        
        // Create image slides from real gallery or fallback
        if (productResponse.imageGallery && productResponse.imageGallery.length > 0) {
          this.productImages.set(productResponse.imageGallery.map((img, i) => ({
            id: img.id,
            imageUrl: `${environment.apiBaseUrl}${img.filePath}`,
            alt: `${productResponse.name} - ${i + 1}`
          })));
        } else {
          const imageUrl = this.getProductImageUrl(productResponse, '400x400');
          this.productImages.set([{ id: 1, imageUrl, alt: productResponse.name }]);
        }
        
        // Get related products (excluding current)
        const related = allProducts.member
          .filter(p => p.id !== Number(productId))
          .slice(0, 4)
          .map(p => this.mapProductToShopProduct(p));
        this.relatedProducts.set(related);
        
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load product:', error);
        this.isLoading.set(false);
      }
    });
  }

  private mapProductToDetail(product: Product): ProductDetail {
    return {
      id: product.id,
      code: product.partNo,
      name: product.name,
      price: product.price,
      image: this.getProductImageUrl(product, '400x400'),
      isFavorite: false,
      group: 'general',
      technicalDescription: product.technicalDescription,
      shortDescription: product.shortDescription,
      weight: product.weight || undefined,
      qtyStep: product.qtyStep ?? null,
      hasDiscount: product.hasDiscount ?? false,
      discountPercent: product.campaignDiscountPercent ?? 0,
      discountedPrice: product.discountedPrice ?? product.price,
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

  private mapProductToShopProduct(product: Product): ShopProduct {
    return {
      id: product.id,
      code: product.partNo,
      name: product.name,
      price: product.price,
      image: this.getProductImageUrl(product),
      isFavorite: false,
      group: 'general',
      weight: product.weight || undefined,
      qtyStep: product.qtyStep ?? null,
      hasDiscount: product.hasDiscount ?? false,
      discountPercent: product.campaignDiscountPercent ?? 0,
      discountedPrice: product.discountedPrice ?? product.price,
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

  private getProductImageUrl(product: Product, size: string = '200x200'): string {
    if (product.featuredImage?.filePath) {
      return `${environment.apiBaseUrl}${product.featuredImage.filePath}`;
    }
    const encodedName = encodeURIComponent(product.shortDescription || product.name);
    return `https://placehold.co/${size}/f5f5f5/666?text=${encodedName}`;
  }

  getDocumentUrl(doc: { filePath: string }): string {
    return `${environment.apiBaseUrl}${doc.filePath}`;
  }

  getDocumentIcon(mimeType: string): string {
    if (mimeType?.includes('pdf')) return 'file-text';
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel') || mimeType?.includes('csv')) return 'file-spreadsheet';
    return 'file';
  }

  goBack(): void {
    this.router.navigate(['/customer/shop/products']);
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
    const product = this.product();
    // addItem returns false when an agent hasn't selected a client (shows its
    // own notification); only show the success toast when actually added.
    if (product && this.cartService.addItem(product, this.quantity())) {
      this.showToast.set(true);
    }
  }

  addToWishlist(): void {
    const product = this.product();
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
    }
  }

  toggleFavorite(product: ShopProduct, event: Event): void {
    event.stopPropagation();
    this.onFavoriteToggle(product);
  }

  onFavoriteToggle(product: ShopProduct): void {
    const wasInWishlist = product.isFavorite;
    const updated = this.relatedProducts().map(p =>
      p.id === product.id ? { ...p, isFavorite: !p.isFavorite } : p
    );
    this.relatedProducts.set(updated);

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

  onRelatedProductClick(product: ShopProduct): void {
    this.router.navigate(['/customer/shop/products', product.id]);
    // Route subscription will handle loading the new product
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
