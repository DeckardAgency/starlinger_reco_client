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
interface OrderProduct {
  partNo: string;
  productName: string;
  weight: string;
  quantity: number;
  unitPrice: number;
  discount: string;
  price: number;
}

interface MachineGroup {
  id: string;
  name: string;
  products: OrderProduct[];
  isExpanded: boolean;
}

interface LogMessage {
  status: string;
  statusVariant: 'success' | 'warning' | 'info' | 'secondary';
  dateTime: string;
  user: string;
  message: string;
}

interface ShopOrderDetail {
  id: string;
  internalRef: string;
  dateCreated: string;
  partsOrdered: number;
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
  machineGroups: MachineGroup[];
  orderTotal: number;
  amountPaid: number;
  logMessages: LogMessage[];
}

const EMPTY_ORDER: ShopOrderDetail = {
  id: '',
  internalRef: '',
  dateCreated: '',
  partsOrdered: 0,
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
  machineGroups: [],
  orderTotal: 0,
  amountPaid: 0,
  logMessages: []
};

@Component({
  selector: 'app-shop-order-detail',
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
  templateUrl: './shop-order-detail.component.html',
  styleUrls: ['./shop-order-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShopOrderDetailComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // Breadcrumb items
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Shop orders', route: '/admin/shop-orders' }
  ];

  // Order data
  order = signal<ShopOrderDetail>({ ...EMPTY_ORDER });



  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const orderId = params.get('id');
        if (orderId) {
          this.loadOrder(orderId);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadOrder(id: string): void {
    // Mock data - in real app this would be an API call
    const mockOrder: ShopOrderDetail = {
      id: '0001',
      internalRef: '000123-ABC',
      dateCreated: '14-03-2024',
      partsOrdered: 12,
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
      machineGroups: [
        {
          id: 'machine-1',
          name: '200XE Winding Machine',
          isExpanded: true,
          products: [
            { partNo: 'AIVV-01152', productName: 'Power panel T30 4,3" WQVGA color touch', weight: '0,4 kg', quantity: 2, unitPrice: 556.17, discount: '10 %', price: 1112.34 },
            { partNo: 'ZME-01171D', productName: 'Modul FU-Stacofil 200XE', weight: '1,4 kg', quantity: 3, unitPrice: 442.46, discount: '20 %', price: 1327.38 },
            { partNo: 'AEPI-01072', productName: 'ABTASTKOPF f. induktives Winkelmesssystem', weight: '0,263 kg', quantity: 2, unitPrice: 868.10, discount: '–', price: 1736.36 }
          ]
        },
        {
          id: 'machine-2',
          name: 'Alpha 6.0 Machine',
          isExpanded: true,
          products: [
            { partNo: 'AIHR-01039', productName: 'Heating element', weight: '1,5 kg', quantity: 3, unitPrice: 1855.01, discount: '10 %', price: 5565.03 },
            { partNo: 'VYC-00245F', productName: 'SL 6 Shuttle Wheel (6,5°) for Reed 10°', weight: '0,09 kg', quantity: 2, unitPrice: 11.54, discount: '–', price: 23.08 }
          ]
        }
      ],
      orderTotal: 9764.19,
      amountPaid: 7811.352,
      logMessages: [
        { status: 'Completed', statusVariant: 'success', dateTime: '19-03-2024 | 16:30', user: '#username', message: 'Inquiry completed' },
        { status: 'In progress', statusVariant: 'warning', dateTime: '19-03-2024 | 16:30', user: 'Starlinger', message: 'Inquiry in progress' },
        { status: 'Information provided', statusVariant: 'warning', dateTime: '18-03-2024 | 09:15', user: '#username', message: 'Missing information provided by the customer.' },
        { status: 'More info', statusVariant: 'warning', dateTime: '17-03-2024 | 14:45', user: 'Starlinger', message: 'Missing information requested by the admin.' },
        { status: 'In review', statusVariant: 'warning', dateTime: '16-03-2024 | 10:00', user: 'Starlinger', message: 'Inquiry in review by the admin.' },
        { status: 'Submitted', statusVariant: 'info', dateTime: '15-03-2024 | 19:30', user: '#username', message: 'Inquiry submitted by the customer.' }
      ]
    };

    this.order.set(mockOrder);
    this.breadcrumbItems = [
      { label: 'Shop orders', route: '/admin/shop-orders' },
      { label: `Inquiry #${mockOrder.id}` }
    ];
    this.cdr.markForCheck();
  }

  // Event handlers
  onEnableSaleChange(value: boolean): void {
    this.order.update(o => ({ ...o, enableSale: value }));
  }

  toggleMachineGroup(groupId: string): void {
    this.order.update(o => ({
      ...o,
      machineGroups: o.machineGroups.map(g =>
        g.id === groupId ? { ...g, isExpanded: !g.isExpanded } : g
      )
    }));
  }

  goBack(): void {
    this.router.navigate(['/admin/shop-orders']);
  }

  onExport(): void {
    console.log('Export order...');
  }

  onPrint(): void {
    console.log('Print order...');
  }

  onSave(): void {
    console.log('Save order...', this.order());
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
}

