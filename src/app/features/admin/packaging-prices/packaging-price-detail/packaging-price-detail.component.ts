import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PackagingPrice } from '@core/models/packaging-price.model';

const EMPTY_PACKAGING_PRICE: PackagingPrice = {
  id: '',
  name: '',
  sizeFrom: 0,
  sizeTo: 0,
  priceBase: 0
};

@Component({
  selector: 'app-packaging-price-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './packaging-price-detail.component.html',
  styleUrls: ['./packaging-price-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PackagingPriceDetailComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  isEditMode = signal(false);
  packagingPriceId = signal<string | null>(null);
  packagingPrice = signal<PackagingPrice>(EMPTY_PACKAGING_PRICE);
  isLoading = signal(false);

  constructor() {
    this.route.params.pipe(takeUntilDestroyed()).subscribe(params => {
      const id = params['id'];
      if (id && id !== 'new') {
        this.packagingPriceId.set(id);
        this.isEditMode.set(true);
        this.loadPackagingPrice(id);
      } else {
        this.isEditMode.set(false);
        this.packagingPrice.set({ ...EMPTY_PACKAGING_PRICE });
      }
    });
  }

  ngOnInit(): void {}

  private loadPackagingPrice(id: string): void {
    this.isLoading.set(true);
    import('@core/mocks/mock-data').then(({ mockPackagingPrices }) => {
      const found = mockPackagingPrices.find((pp: PackagingPrice) => pp.id === id);
      if (found) {
        this.packagingPrice.set({ ...found });
      }
      this.isLoading.set(false);
      this.cdr.markForCheck();
    });
  }

  onSizeFromChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.packagingPrice.update(pp => ({ ...pp, sizeFrom: parseFloat(input.value) || 0 }));
  }

  onSizeToChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.packagingPrice.update(pp => ({ ...pp, sizeTo: parseFloat(input.value) || 0 }));
  }

  onPriceBaseChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.packagingPrice.update(pp => ({ ...pp, priceBase: parseFloat(input.value) || 0 }));
  }

  onSave(): void {
    console.log('Saving packaging price:', this.packagingPrice());
    this.router.navigate(['/admin/packaging-prices']);
  }

  onDiscard(): void {
    this.router.navigate(['/admin/packaging-prices']);
  }

  goBack(): void {
    this.router.navigate(['/admin/packaging-prices']);
  }
}

