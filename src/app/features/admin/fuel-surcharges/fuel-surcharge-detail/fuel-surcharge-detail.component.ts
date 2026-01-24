import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
import { BreadcrumbsComponent, BreadcrumbItem } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { DetailHeaderComponent } from '@app/ui-kit/molecules/detail-header/detail-header.component';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';

interface FuelSurchargeDetail {
  id: string;
  name: string;
  date: string;
  fuelSurcharge: number;
  deliveryType: string;
}

const EMPTY_FUEL_SURCHARGE: FuelSurchargeDetail = {
  id: '',
  name: '',
  date: '',
  fuelSurcharge: 0,
  deliveryType: ''
};

interface SelectOption {
  value: string;
  label: string;
}

const DELIVERY_TYPE_OPTIONS: SelectOption[] = [
  { value: 'DHL', label: 'DHL' },
  { value: 'FedEx', label: 'FedEx' },
  { value: 'UPS', label: 'UPS' },
  { value: 'Standard', label: 'Standard' },
  { value: 'Express', label: 'Express' }
];

@Component({
  selector: 'app-fuel-surcharge-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    FormFieldComponent,
    BreadcrumbsComponent,
    DetailHeaderComponent,
    MobileFooterComponent,
    IconComponent
  ],
  templateUrl: './fuel-surcharge-detail.component.html',
  styleUrls: ['./fuel-surcharge-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FuelSurchargeDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fuelSurchargeId: string | null = null;

  // Form state
  fuelSurcharge = signal<FuelSurchargeDetail>({ ...EMPTY_FUEL_SURCHARGE });
  isEditMode = signal(false);
  isLoading = signal(false);

  // Dropdown options
  deliveryTypeOptions = DELIVERY_TYPE_OPTIONS;

  // Selected value for native select
  selectedDeliveryType = '';

  // Breadcrumb items
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Fuel surcharge', route: '/admin/fuel-surcharges' },
    { label: 'Edit', route: '' }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.fuelSurchargeId = params['id'] || null;
      this.isEditMode.set(!!this.fuelSurchargeId && this.fuelSurchargeId !== 'new');

      if (this.isEditMode()) {
        this.loadFuelSurcharge(this.fuelSurchargeId!);
      } else {
        this.fuelSurcharge.set({ ...EMPTY_FUEL_SURCHARGE });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadFuelSurcharge(id: string): void {
    this.isLoading.set(true);
    import('@core/mocks/mock-data').then(({ mockFuelSurcharges }) => {
      const found = mockFuelSurcharges.find(fs => fs.id === id);
      if (found) {
        this.fuelSurcharge.set({ ...found });
        this.selectedDeliveryType = found.deliveryType;
      }
      this.isLoading.set(false);
      this.cdr.markForCheck();
    });
  }

  // Navigation
  goBack(): void {
    this.router.navigate(['/admin/fuel-surcharges']);
  }

  // Form handlers
  onDeliveryTypeChange(): void {
    if (this.selectedDeliveryType) {
      this.fuelSurcharge.update(fs => ({ ...fs, deliveryType: this.selectedDeliveryType }));
    }
  }

  removeDeliveryType(): void {
    this.fuelSurcharge.update(fs => ({ ...fs, deliveryType: '' }));
    this.selectedDeliveryType = '';
  }

  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fuelSurcharge.update(fs => ({ ...fs, date: input.value }));
  }

  onFuelSurchargeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value.replace(',', '.')) || 0;
    this.fuelSurcharge.update(fs => ({ ...fs, fuelSurcharge: value }));
  }

  formatFuelSurcharge(value: number): string {
    if (value === 0) return '';
    return value.toString().replace('.', ',');
  }

  // Save actions
  onSave(): void {
    console.log('Saving fuel surcharge:', this.fuelSurcharge());
    this.router.navigate(['/admin/fuel-surcharges']);
  }

  onSaveAndContinue(): void {
    console.log('Save and continue:', this.fuelSurcharge());
  }
}

