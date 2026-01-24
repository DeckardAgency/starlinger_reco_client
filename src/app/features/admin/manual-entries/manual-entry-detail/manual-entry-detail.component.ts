import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { BreadcrumbsComponent, BreadcrumbItem } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';
import { ToggleComponent } from '@app/ui-kit/atoms/toggle/toggle.component';
import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { mockManualEntryDetail } from '@core/mocks/mock-data';

// Interfaces
interface AttachedFile {
  name: string;
  size: string;
  type: 'pdf' | 'image' | 'spreadsheet' | 'text';
}

interface InquiryPart {
  id: string;
  partNumber: string;
  machineName: string;
  productName: string;
  detailedDescription: string;
  attachedFiles: AttachedFile[];
  additionalNotes: string;
  isExpanded: boolean;
}

interface LogMessage {
  status: string;
  statusVariant: 'success' | 'warning' | 'info' | 'secondary';
  dateTime: string;
  user: string;
  message: string;
}

interface ManualEntryDetail {
  id: string;
  internalRef: string;
  dateCreated: string;
  status: string;
  enableSale: boolean;
  account: string;
  contact: string;
  contactDropdown: string;
  billingAddress: string;
  date: string;
  paymentType: string;
  deliveryType: string;
  priceWithoutTax: number;
  totalPrice: number;
  priceTax: number;
  inquiryParts: InquiryPart[];
  logMessages: LogMessage[];
}

const EMPTY_ENTRY: ManualEntryDetail = {
  id: '',
  internalRef: '',
  dateCreated: '',
  status: 'new',
  enableSale: false,
  account: '',
  contact: '',
  contactDropdown: '',
  billingAddress: '',
  date: '',
  paymentType: '',
  deliveryType: '',
  priceWithoutTax: 0,
  totalPrice: 0,
  priceTax: 0,
  inquiryParts: [],
  logMessages: []
};

@Component({
  selector: 'app-manual-entry-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbsComponent,
    BadgeComponent,
    ToggleComponent,
    FormFieldComponent,
    IconComponent
  ],
  templateUrl: './manual-entry-detail.component.html',
  styleUrls: ['./manual-entry-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManualEntryDetailComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // Breadcrumb items
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Manual entry', route: '/admin/manual-entries' }
  ];

  // Entry data
  entry = signal<ManualEntryDetail>({ ...EMPTY_ENTRY });

  // Dropdown options
  contactOptions = [
    { value: 'martina', label: 'Martina Kemper - Unistrap Gmbh' },
    { value: 'john', label: 'John Doe - Unistrap Gmbh' },
    { value: 'jane', label: 'Jane Smith - Unistrap Gmbh' }
  ];

  billingAddressOptions = [
    { value: 'wien', label: '1060 Wien, Sonnenuhrgasse 4' },
    { value: 'graz', label: '8010 Graz, Hauptplatz 1' },
    { value: 'linz', label: '4020 Linz, Landstraße 15' }
  ];

  statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  paymentTypeOptions = [
    { value: 'bank-transfer', label: 'Bank transfer' },
    { value: 'credit-card', label: 'Credit card' },
    { value: 'paypal', label: 'PayPal' }
  ];

  deliveryTypeOptions = [
    { value: 'dhl', label: 'DHL' },
    { value: 'fedex', label: 'FedEx' },
    { value: 'ups', label: 'UPS' },
    { value: 'pickup', label: 'Pickup' }
  ];

  // Selected values for ngModel
  selectedContact = '';
  selectedBillingAddress = '';
  selectedStatus = '';
  selectedPaymentType = '';
  selectedDeliveryType = '';

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const entryId = params.get('id');
        if (entryId) {
          this.loadEntry(entryId);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadEntry(id: string): void {
    // In real app this would be an API call
    const entryData = mockManualEntryDetail as ManualEntryDetail;

    this.entry.set(entryData);
    this.breadcrumbItems = [
      { label: 'Manual entry', route: '/admin/manual-entries' },
      { label: `Inquiry #${entryData.id}` }
    ];
    
    // Set selected values
    this.selectedContact = entryData.contactDropdown;
    this.selectedBillingAddress = entryData.billingAddress;
    this.selectedStatus = entryData.status;
    this.selectedPaymentType = entryData.paymentType;
    this.selectedDeliveryType = entryData.deliveryType;
    
    this.cdr.markForCheck();
  }

  // Event handlers
  onEnableSaleChange(value: boolean): void {
    this.entry.update(e => ({ ...e, enableSale: value }));
  }

  // Dropdown change handlers
  onContactChange(): void {
    const option = this.contactOptions.find(o => o.value === this.selectedContact);
    if (option) {
      this.entry.update(e => ({ ...e, contact: option.label, contactDropdown: this.selectedContact }));
    }
  }

  onBillingAddressChange(): void {
    this.entry.update(e => ({ ...e, billingAddress: this.selectedBillingAddress }));
  }

  onStatusChange(): void {
    this.entry.update(e => ({ ...e, status: this.selectedStatus }));
  }

  onPaymentTypeChange(): void {
    this.entry.update(e => ({ ...e, paymentType: this.selectedPaymentType }));
  }

  onDeliveryTypeChange(): void {
    this.entry.update(e => ({ ...e, deliveryType: this.selectedDeliveryType }));
  }

  // Remove pill handlers
  removeContact(): void {
    this.selectedContact = '';
    this.entry.update(e => ({ ...e, contact: '', contactDropdown: '' }));
  }

  removeBillingAddress(): void {
    this.selectedBillingAddress = '';
    this.entry.update(e => ({ ...e, billingAddress: '' }));
  }

  removeStatus(): void {
    this.selectedStatus = '';
    this.entry.update(e => ({ ...e, status: '' }));
  }

  removePaymentType(): void {
    this.selectedPaymentType = '';
    this.entry.update(e => ({ ...e, paymentType: '' }));
  }

  removeDeliveryType(): void {
    this.selectedDeliveryType = '';
    this.entry.update(e => ({ ...e, deliveryType: '' }));
  }

  getContactLabel(): string {
    const option = this.contactOptions.find(o => o.value === this.selectedContact);
    return option ? option.label : '';
  }

  getBillingAddressLabel(): string {
    const option = this.billingAddressOptions.find(o => o.value === this.selectedBillingAddress);
    return option ? option.label : '';
  }

  getStatusLabel(): string {
    const option = this.statusOptions.find(o => o.value === this.selectedStatus);
    return option ? option.label : '';
  }

  getPaymentTypeLabel(): string {
    const option = this.paymentTypeOptions.find(o => o.value === this.selectedPaymentType);
    return option ? option.label : '';
  }

  getDeliveryTypeLabel(): string {
    const option = this.deliveryTypeOptions.find(o => o.value === this.selectedDeliveryType);
    return option ? option.label : '';
  }

  toggleInquiryPart(partId: string): void {
    this.entry.update(e => ({
      ...e,
      inquiryParts: e.inquiryParts.map(p =>
        p.id === partId ? { ...p, isExpanded: !p.isExpanded } : p
      )
    }));
  }

  goBack(): void {
    this.router.navigate(['/admin/manual-entries']);
  }

  onExport(): void {
    console.log('Export entry...');
  }

  onPrint(): void {
    console.log('Print entry...');
  }

  onSave(): void {
    console.log('Save entry...', this.entry());
  }

  onViewFile(file: AttachedFile): void {
    console.log('View file:', file.name);
  }

  getStatusBadgeVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'secondary' {
    switch (status.toLowerCase()) {
      case 'new': return 'success';
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  }

  formatCurrency(value: number): string {
    return `€ ${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  getFileIcon(type: string): string {
    switch (type) {
      case 'pdf':
      case 'text':
        return 'file-text';
      case 'image':
        return 'image';
      case 'spreadsheet':
        return 'file-spreadsheet';
      default:
        return 'file-text';
    }
  }
}

