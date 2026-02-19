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
        
        // Create image slides using placeholder
        const imageUrl = this.getProductImageUrl(productResponse, '400x400');
        this.productImages.set([
          { id: 1, imageUrl, alt: productResponse.name },
          { id: 2, imageUrl, alt: `${productResponse.name} - View 2` },
          { id: 3, imageUrl, alt: `${productResponse.name} - View 3` }
        ]);
        
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
      shortDescription: product.shortDescription
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
      group: 'general'
    };
  }

  private getProductImageUrl(product: Product, size: string = '200x200'): string {
    // Use placeholder with product name - images don't exist in dev environment
    const encodedName = encodeURIComponent(product.shortDescription || product.name);
    return `https://placehold.co/${size}/f5f5f5/666?text=${encodedName}`;
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
    if (product) {
      this.cartService.addItem(product, this.quantity());
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
