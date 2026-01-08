import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { BreadcrumbsComponent, BreadcrumbItem } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';
import { ToggleComponent } from '@app/ui-kit/atoms/toggle/toggle.component';
import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';

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
    FormFieldComponent
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
    // Mock data - in real app this would be an API call
    const mockEntry: ManualEntryDetail = {
      id: '0002',
      internalRef: '000123-ABC',
      dateCreated: '14-03-2024',
      status: 'new',
      enableSale: true,
      account: 'Unistrap Gmbh - finanz.ke@starlinger.com',
      contact: 'Martina Kemper - Unistrap Gmbh',
      contactDropdown: 'martina',
      billingAddress: 'wien',
      date: '09/04/2025',
      paymentType: 'bank-transfer',
      deliveryType: 'dhl',
      priceWithoutTax: 4764.74,
      totalPrice: 5724.20,
      priceTax: 956.40,
      inquiryParts: [
        {
          id: 'part-1',
          partNumber: 'Part 1',
          machineName: 'ad*StarKON Machine',
          productName: 'Power panel T30 4,3" WQVGA color touch',
          detailedDescription: 'Hello! I need a replacement part for my 200XE Winding Machine. Not sure about the exact part needed, please check the attached files for more info.',
          attachedFiles: [
            { name: 'electric_response.pdf', size: '3.4 MB', type: 'pdf' },
            { name: 'machine_side_view_99.jpg', size: '1.2 MB', type: 'image' },
            { name: 'system_error_report.xls', size: '0.3MB', type: 'spreadsheet' }
          ],
          additionalNotes: 'Please get back to us ASAP, we need this part urgent, production stopped!',
          isExpanded: true
        },
        {
          id: 'part-2',
          partNumber: 'Part 2',
          machineName: 'EX200 Weaving Machine',
          productName: 'Power panel T30 4,3" WQVGA color touch',
          detailedDescription: 'Hello! I need a replacement part for my 200XE Winding Machine. Not sure about the exact part needed, please check the attached files for more info.',
          attachedFiles: [
            { name: 'electric_response.pdf', size: '3.4 MB', type: 'pdf' },
            { name: 'machine_side_view_99.jpg', size: '1.2 MB', type: 'image' },
            { name: 'system_error_report.xls', size: '0.3MB', type: 'spreadsheet' }
          ],
          additionalNotes: 'Please get back to us ASAP, we need this part urgent, production stopped!',
          isExpanded: true
        }
      ],
      logMessages: [
        { status: 'Completed', statusVariant: 'success', dateTime: '19-03-2024 | 16:30', user: '#username', message: 'Inquiry completed' },
        { status: 'In progress', statusVariant: 'warning', dateTime: '19-03-2024 | 16:30', user: 'Starlinger', message: 'Inquiry in progress' },
        { status: 'Information provided', statusVariant: 'warning', dateTime: '18-03-2024 | 09:15', user: '#username', message: 'Missing information provided by the customer.' },
        { status: 'More info', statusVariant: 'warning', dateTime: '17-03-2024 | 14:45', user: 'Starlinger', message: 'Missing information requested by the admin.' },
        { status: 'In review', statusVariant: 'warning', dateTime: '16-03-2024 | 10:00', user: 'Starlinger', message: 'Inquiry in review by the admin.' },
        { status: 'Submitted', statusVariant: 'info', dateTime: '15-03-2024 | 19:30', user: '#username', message: 'Inquiry submitted by the customer.' }
      ]
    };

    this.entry.set(mockEntry);
    this.breadcrumbItems = [
      { label: 'Manual entry', route: '/admin/manual-entries' },
      { label: `Inquiry #${mockEntry.id}` }
    ];
    this.cdr.markForCheck();
  }

  // Event handlers
  onEnableSaleChange(value: boolean): void {
    this.entry.update(e => ({ ...e, enableSale: value }));
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

