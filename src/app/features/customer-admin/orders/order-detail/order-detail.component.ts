import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { BreadcrumbsComponent, BreadcrumbItem } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';
import { ButtonComponent } from '@app/ui-kit/atoms/button/button.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { mockOrderDetails, mockOrderHistory, OrderDetail, OrderDetailMachineGroup, InquiryDetailPart } from '@core/mocks/mock-data';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbsComponent,
    BadgeComponent,
    ButtonComponent,
    IconComponent
  ],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // Breadcrumb items
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'My inquiries', route: '/customer-admin/orders' },
    { label: 'History', route: '/customer-admin/orders' }
  ];

  // Order data
  order = signal<OrderDetail | null>(null);

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
    // Try to get from detail data first
    let orderData = mockOrderDetails[id];
    
    // If not in details, get basic info from history and create a mock
    if (!orderData) {
      const historyItem = mockOrderHistory.find(o => o.id === id);
      if (historyItem) {
        orderData = this.createMockDetail(historyItem);
      }
    }

    if (orderData) {
      this.order.set(orderData);
      this.breadcrumbItems = [
        { label: 'My inquiries', route: '/customer-admin/orders' },
        { label: 'History', route: '/customer-admin/orders' },
        { label: `Inquiry #${orderData.id}` }
      ];
    }
    
    this.cdr.markForCheck();
  }

  private createMockDetail(historyItem: any): OrderDetail {
    // Generate mock detail based on history item
    if (historyItem.type === 'order') {
      return {
        id: historyItem.id,
        type: 'order',
        internalRef: historyItem.internalRef,
        dateCreated: historyItem.dateCreated,
        partsOrdered: historyItem.partsOrdered,
        status: historyItem.status,
        machineGroups: [
          {
            id: 'machine-1',
            name: '200XE Winding Machine',
            isExpanded: true,
            products: [
              { partNo: 'AIVV-01152', productName: 'Power panel T30 4,3" WQVGA color touch', weight: '0,4 kg', quantity: 2, unitPrice: 556.17, discount: '10 %', price: 1112.34 },
              { partNo: 'ZME-01171D', productName: 'Modul FU-Stacofil 200XE', weight: '1,4 kg', quantity: 3, unitPrice: 442.46, discount: '20 %', price: 1327.38 }
            ]
          }
        ],
        totalPrice: 2439.72,
        logMessages: [
          { status: 'Completed', statusVariant: 'success', dateTime: '19-03-2024 | 16:30', user: '#username', message: 'Order completed' },
          { status: 'Submitted', statusVariant: 'info', dateTime: '15-03-2024 | 19:30', user: '#username', message: 'Order submitted by the customer.' }
        ]
      };
    } else {
      return {
        id: historyItem.id,
        type: 'inquiry',
        internalRef: historyItem.internalRef,
        dateCreated: historyItem.dateCreated,
        status: historyItem.status,
        parts: [
          {
            id: 'part-1',
            partNumber: 'Part 1',
            machineName: 'ad*StarKON Machine',
            productName: 'Power panel T30 4,3" WQVGA color touch',
            description: 'Hello! I need a replacement part for my machine.',
            files: [
              { id: 'f1', name: 'request_details.pdf', type: 'pdf', size: '2.1 MB' }
            ],
            notes: 'Please respond as soon as possible.',
            isExpanded: true
          }
        ],
        logMessages: [
          { status: 'Completed', statusVariant: 'success', dateTime: '19-03-2024 | 16:30', user: '#username', message: 'Inquiry completed' },
          { status: 'Submitted', statusVariant: 'info', dateTime: '15-03-2024 | 19:30', user: '#username', message: 'Inquiry submitted by the customer.' }
        ]
      };
    }
  }

  // Navigation
  goBack(): void {
    this.router.navigate(['/customer-admin/orders']);
  }

  // Actions
  onExport(): void {
    console.log('Export order...');
  }

  onPrint(): void {
    console.log('Print order...');
  }

  onDelete(): void {
    console.log('Delete order...');
  }

  // Toggle machine group expansion
  toggleMachineGroup(groupId: string): void {
    const current = this.order();
    if (current?.machineGroups) {
      this.order.set({
        ...current,
        machineGroups: current.machineGroups.map(g =>
          g.id === groupId ? { ...g, isExpanded: !g.isExpanded } : g
        )
      });
    }
  }

  // Toggle inquiry part expansion
  togglePart(partId: string): void {
    const current = this.order();
    if (current?.parts) {
      this.order.set({
        ...current,
        parts: current.parts.map(p =>
          p.id === partId ? { ...p, isExpanded: !p.isExpanded } : p
        )
      });
    }
  }

  // Helper methods
  getTypeBadgeLabel(): string {
    return this.order()?.type === 'order' ? 'Order' : 'Inquiry';
  }

  getStatusBadgeVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'secondary' {
    switch (status.toLowerCase()) {
      case 'completed': return 'success';
      case 'in progress':
      case 'in_progress': return 'warning';
      case 'cancelled': return 'danger';
      case 'pending': return 'info';
      default: return 'secondary';
    }
  }

  getStatusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  }

  formatCurrency(value: number): string {
    return `€ ${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  calculateGroupTotal(group: OrderDetailMachineGroup): number {
    return group.products.reduce((sum, p) => sum + p.price, 0);
  }

  getFileIcon(type: string): string {
    switch (type) {
      case 'pdf': return 'file-text';
      case 'image': return 'image';
      case 'spreadsheet': return 'file-spreadsheet';
      default: return 'file';
    }
  }
}
