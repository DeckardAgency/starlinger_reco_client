import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '@core/models';
import { ProductService } from '@core/services/http/product.service';
import { PriceFilterAdvancedPipe } from '@shared/pipes/price-filter-advanced.pipe';

@Component({
  selector: 'app-products',
  imports: [
    CommonModule,
    PriceFilterAdvancedPipe
  ],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsComponent implements OnInit {
  private productService = inject(ProductService);

  products = signal<Product[]>([]);
  filteredProducts = signal<Product[]>([]);
  isLoading = signal(true);
  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.productService.getProducts().subscribe({
      next: (collection) => {
        this.products.set(collection.member);
        this.filteredProducts.set(collection.member);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
}
