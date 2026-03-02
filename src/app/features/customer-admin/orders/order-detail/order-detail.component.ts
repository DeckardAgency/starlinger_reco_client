import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { BreadcrumbsComponent, BreadcrumbItem } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';
import { ButtonComponent } from '@app/ui-kit/atoms/button/button.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { OrderService } from '@core/services/http/order.service';
import { CartService } from '@core/services/cart.service';
import { Order } from '@core/models/order.model';

// Display interfaces
interface OrderDetailProduct {
  partNo: string;
  productName: string;
  weight: string;
  quantity: number;
  unitPrice: number;
  discount: string;
  price: number;
}

interface OrderDetailProductGroup {
  id: string;
  name: string;
  products: OrderDetailProduct[];
  isExpanded: boolean;
}

interface OrderDetailLogMessage {
  status: string;
  statusVariant: 'success' | 'warning' | 'info' | 'secondary' | 'danger';
  dateTime: string;
  user: string;
  message: string;
}

interface OrderDetail {
  id: number;
  type: 'order';
  internalRef: string;
  dateCreated: string;
  partsOrdered?: number;
  status: string;
  productGroups?: OrderDetailProductGroup[];
  totalPrice?: number;
  amountPaid?: number;
  logMessages: OrderDetailLogMessage[];
}

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbsComponent,
    BadgeComponent,
    ButtonComponent,
    IconComponent,
    MobileFooterComponent
  ],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);
  private cartService = inject(CartService);
  private destroy$ = new Subject<void>();

  // Loading state
  isLoading = signal(true);

  // Breadcrumb items
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'My orders', route: '/customer-admin/orders' },
    { label: 'History', route: '/customer-admin/orders' }
  ];

  // Order data
  order = signal<OrderDetail | null>(null);
  isDraft = signal(false);
  private rawOrder: Order | null = null;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const orderId = params.get('id');
        if (orderId) {
          this.loadItem(orderId);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadItem(id: string): void {
    this.isLoading.set(true);

    this.orderService.getOrder(id).subscribe({
      next: (order) => {
        if (order) {
          this.rawOrder = order;
          this.order.set(this.mapOrderToDetail(order));
          this.isDraft.set(order.isDraft === true || order.status === 'draft');
          this.updateBreadcrumbs('Order', String(order.orderNumber || order.id));
        } else {
          this.order.set(null);
        }
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load order:', error);
        this.order.set(null);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  private updateBreadcrumbs(type: string, ref: string): void {
    this.breadcrumbItems = [
      { label: 'My orders', route: '/customer-admin/orders' },
      { label: 'History', route: '/customer-admin/orders' },
      { label: `${type} #${ref}` }
    ];
  }

  private mapOrderToDetail(order: Order): OrderDetail {
    // Group items into product groups
    const productGroups: OrderDetailProductGroup[] = [];
    
    if (order.items && order.items.length > 0) {
      const defaultGroup: OrderDetailProductGroup = {
        id: 'default',
        name: 'Order Items',
        isExpanded: true,
        products: order.items.map(item => ({
          partNo: item.product?.partNo || '',
          productName: item.product?.name || '',
          weight: item.product?.weight || '-',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: '-',
          price: item.subtotal
        }))
      };
      productGroups.push(defaultGroup);
    }

    // Map logs
    const logMessages: OrderDetailLogMessage[] = (order.logs || []).map(log => ({
      status: this.getStatusLabel(log.newStatus),
      statusVariant: this.getLogStatusVariant(log.newStatus),
      dateTime: this.formatDateTime(log.createdAt),
      user: 'System',
      message: log.comment || `Status changed from ${log.previousStatus} to ${log.newStatus}`
    }));

    return {
      id: order.id,
      type: 'order',
      internalRef: String(order.orderNumber || order.id),
      dateCreated: this.formatDate(order.createdAt),
      partsOrdered: order.items?.length || 0,
      status: order.status,
      productGroups,
      totalPrice: order.totalAmount,
      logMessages
    };
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private formatDateTime(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}-${month}-${year} | ${hours}:${minutes}`;
  }

  private getLogStatusVariant(status: string): 'success' | 'warning' | 'info' | 'secondary' | 'danger' {
    const lowerStatus = (status || '').toLowerCase();
    if (lowerStatus === 'completed' || lowerStatus === 'delivered') return 'success';
    if (lowerStatus === 'cancelled' || lowerStatus === 'rejected') return 'danger';
    if (lowerStatus === 'in_progress' || lowerStatus === 'processing') return 'warning';
    if (lowerStatus === 'submitted' || lowerStatus === 'pending') return 'info';
    return 'secondary';
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

  onAddToCart(): void {
    if (!this.rawOrder) return;
    this.cartService.loadFromDraft(this.rawOrder);
    this.router.navigate(['/customer/shop/products']);
    this.cartService.openCart();
  }

  // Toggle product group expansion
  toggleProductGroup(groupId: string): void {
    const current = this.order();
    if (current?.productGroups) {
      this.order.set({
        ...current,
        productGroups: current.productGroups.map(g =>
          g.id === groupId ? { ...g, isExpanded: !g.isExpanded } : g
        )
      });
    }
  }

  // Helper methods
  getTypeBadgeLabel(): string {
    return 'Order';
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

  calculateGroupTotal(group: OrderDetailProductGroup): number {
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
