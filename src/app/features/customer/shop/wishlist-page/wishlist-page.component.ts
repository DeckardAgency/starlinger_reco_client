import { Component, ChangeDetectionStrategy, signal, inject, ChangeDetectorRef, AfterViewInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { WishlistService } from '@core/services/wishlist.service';
import { WishlistItem } from '@core/models/wishlist.model';
import { DataTableComponent, TableColumn } from '@app/ui-kit/organisms/data-table/data-table.component';

@Component({
  selector: 'app-wishlist-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DataTableComponent
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
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  wishlistItems = this.wishlistService.wishlistItems;
  columns: TableColumn[] = [];

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
    console.log('Adding all wishlist items to cart:', this.wishlistItems());
    // Navigate to cart or add items to cart service
    this.router.navigate(['/customer/shop/cart']);
  }
}

