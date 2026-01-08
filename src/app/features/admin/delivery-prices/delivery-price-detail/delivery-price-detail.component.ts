import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
import { DeliveryPrice } from '@core/models/delivery-price.model';

interface DeliveryPriceDetail {
  id: string;
  name: string;
  dhlZone: string;
  deliveryType: string;
  sizeFrom: number;
  sizeTo: number;
  priceBase: number;
  stepStartsAt: number;
  forEveryNextSize: number;
  priceBaseStep: number;
}

const EMPTY_DELIVERY_PRICE: DeliveryPriceDetail = {
  id: '',
  name: '',
  dhlZone: '',
  deliveryType: '',
  sizeFrom: 0,
  sizeTo: 0,
  priceBase: 0,
  stepStartsAt: 0,
  forEveryNextSize: 0,
  priceBaseStep: 0
};

// Options for dropdowns
interface SelectOption {
  value: string;
  label: string;
}

const DHL_ZONE_OPTIONS: SelectOption[] = [
  { value: 'Zone 1', label: 'Zone 1' },
  { value: 'Zone 2', label: 'Zone 2' },
  { value: 'Zone 3', label: 'Zone 3' },
  { value: 'Zone 4', label: 'Zone 4' },
  { value: 'Zone 5', label: 'Zone 5' },
  { value: 'Zone 6', label: 'Zone 6' },
  { value: 'Zone 7', label: 'Zone 7' },
  { value: 'Zone 8', label: 'Zone 8' }
];

const DELIVERY_TYPE_OPTIONS: SelectOption[] = [
  { value: 'Standard', label: 'Standard' },
  { value: 'Express', label: 'Express' }
];

@Component({
  selector: 'app-delivery-price-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    FormFieldComponent
  ],
  templateUrl: './delivery-price-detail.component.html',
  styleUrls: ['./delivery-price-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeliveryPriceDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Mode
  isEditMode = signal(false);
  deliveryPriceId: string | null = null;

  // Data
  deliveryPrice = signal<DeliveryPriceDetail>({ ...EMPTY_DELIVERY_PRICE });

  // Loading state
  isLoading = signal(false);

  // Dropdown options
  dhlZoneOptions = DHL_ZONE_OPTIONS;
  deliveryTypeOptions = DELIVERY_TYPE_OPTIONS;

  // Selected values for native select elements
  selectedDhlZone = '';
  selectedDeliveryType = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.isEditMode.set(true);
        this.deliveryPriceId = params['id'];
        this.loadDeliveryPrice(this.deliveryPriceId!);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDeliveryPrice(id: string): void {
    this.isLoading.set(true);
    import('@core/mocks/mock-data').then(({ mockDeliveryPrices }) => {
      const found = mockDeliveryPrices.find(dp => dp.id === id);
      if (found) {
        this.deliveryPrice.set({ ...found });
        this.selectedDhlZone = found.dhlZone;
        this.selectedDeliveryType = found.deliveryType;
      }
      this.isLoading.set(false);
      this.cdr.markForCheck();
    });
  }

  onBack(): void {
    this.router.navigate(['/admin/delivery-prices']);
  }

  onSave(): void {
    console.log('Save delivery price:', this.deliveryPrice());
    this.router.navigate(['/admin/delivery-prices']);
  }

  onSaveAndContinue(): void {
    console.log('Save and continue:', this.deliveryPrice());
  }

  // Input handlers
  onNameChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.deliveryPrice.update(dp => ({ ...dp, name: input.value }));
  }

  onSizeFromChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value) || 0;
    this.deliveryPrice.update(dp => ({ ...dp, sizeFrom: value }));
  }

  onSizeToChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value) || 0;
    this.deliveryPrice.update(dp => ({ ...dp, sizeTo: value }));
  }

  onPriceBaseChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value.replace(',', '.')) || 0;
    this.deliveryPrice.update(dp => ({ ...dp, priceBase: value }));
  }

  onStepStartsAtChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value) || 0;
    this.deliveryPrice.update(dp => ({ ...dp, stepStartsAt: value }));
  }

  onForEveryNextSizeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value) || 0;
    this.deliveryPrice.update(dp => ({ ...dp, forEveryNextSize: value }));
  }

  onPriceBaseStepChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value.replace(',', '.')) || 0;
    this.deliveryPrice.update(dp => ({ ...dp, priceBaseStep: value }));
  }

  // Select handlers
  onDhlZoneChange(): void {
    if (this.selectedDhlZone) {
      this.deliveryPrice.update(dp => ({ ...dp, dhlZone: this.selectedDhlZone }));
    }
  }

  removeDhlZone(): void {
    this.deliveryPrice.update(dp => ({ ...dp, dhlZone: '' }));
    this.selectedDhlZone = '';
  }

  onDeliveryTypeChange(): void {
    if (this.selectedDeliveryType) {
      this.deliveryPrice.update(dp => ({ ...dp, deliveryType: this.selectedDeliveryType }));
    }
  }

  removeDeliveryType(): void {
    this.deliveryPrice.update(dp => ({ ...dp, deliveryType: '' }));
    this.selectedDeliveryType = '';
  }

  formatNumber(value: number): string {
    return value.toFixed(2).replace('.', ',');
  }
}

