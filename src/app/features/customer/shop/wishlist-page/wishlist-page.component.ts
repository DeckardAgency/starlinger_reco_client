import { Component, ChangeDetectionStrategy, signal, inject, ChangeDetectorRef, AfterViewInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { WishlistService } from '@core/services/wishlist.service';
import { CartService } from '@core/services/cart.service';
import { WishlistItem } from '@core/models/wishlist.model';
import { DataTableComponent, TableColumn } from '@app/ui-kit/organisms/data-table/data-table.component';
import { BreadcrumbsComponent, BreadcrumbItem } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';

@Component({
  selector: 'app-wishlist-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DataTableComponent,
    BreadcrumbsComponent,
    IconComponent
  ],
  templateUrl: './wishlist-page.component.html',
  styleUrls: ['./wishlist-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WishlistPageComponent implements AfterViewInit {
  @ViewChild('itemTemplate') itemTemplate!: TemplateRef<any>;
  @ViewChild('priceTemplate') priceTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  private wishlistService = inject(WishlistService);
  private cartService = inject(CartService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  wishlistItems = this.wishlistService.wishlistItems;
  columns: TableColumn[] = [];

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Shop', route: '/customer/shop' },
    { label: 'Wishlist' }
  ];

  ngAfterViewInit(): void {
    this.columns = [
      { key: 'item', label: 'Item', sortable: false, template: this.itemTemplate },
      { key: 'price', label: 'Price', sortable: false, width: '120px', template: this.priceTemplate },
      { key: 'actions', label: '', sortable: false, width: '48px', template: this.actionsTemplate }
    ];
    this.cdr.detectChanges();
  }

  get itemCount(): number {
    return this.wishlistItems().length;
  }

  formatPrice(price: number): string {
    return `€ ${price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  removeItem(item: WishlistItem): void {
    this.wishlistService.removeItem(item.id);
  }

  onAddToCart(): void {
    const items = this.wishlistItems();
    for (const item of items) {
      this.cartService.addItem({
        id: item.productId,
        code: item.productCode,
        name: item.productName,
        price: item.price,
        image: item.imageUrl,
        isFavorite: true,
        group: ''
      }, item.quantity);
    }
    this.wishlistService.clearWishlist();
    this.cartService.openCart();
  }
}
