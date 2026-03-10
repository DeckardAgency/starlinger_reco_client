import { Component, ChangeDetectionStrategy, ViewChild, TemplateRef, signal, OnInit, AfterViewInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SectionHeaderComponent, TabsComponent, BadgeComponent, AvatarComponent, TableActionsDropdownComponent, TableAction, ActionClickEvent } from '@app/ui-kit';
import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms';
import { Router } from '@angular/router';
import { DashboardService, DashboardOrder } from '@core/services/http/dashboard.service';
import { OrderService } from '@core/services/http/order.service';
import { Order } from '@core/models/order.model';

export type HistoryStatus = 'draft' | 'new' | 'in-process' | 'waiting-for-payment' | 'ready-for-shipment' | 'shipped' | 'delivered' | 'canceled' | 'reversal';
export type HistoryType = 'order' | 'manual';

export interface HistoryItem {
  orderId: string;
  type: HistoryType;
  dateCreated: string;
  internalReference: string;
  customerInitials: string;
  customerName: string;
  partsOrdered: number;
  status: HistoryStatus;
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SectionHeaderComponent,
    TabsComponent,
    DataTableComponent,
    BadgeComponent,
    AvatarComponent,
    TableActionsDropdownComponent
  ],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryComponent implements OnInit, AfterViewInit {
  private dashboardService = inject(DashboardService);
  private orderService = inject(OrderService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('typeCell', { static: true }) typeCell!: TemplateRef<any>;
  @ViewChild('customerCell', { static: true }) customerCell!: TemplateRef<any>;
  @ViewChild('statusCell', { static: true }) statusCell!: TemplateRef<any>;
  @ViewChild('actionsCell', { static: true }) actionsCell!: TemplateRef<any>;

  activeTab = signal('latest');
  sortColumn = signal<string | null>('dateCreated');
  sortDirection = signal<'asc' | 'desc' | null>('desc');
  openMenuRowId = signal<string | null>(null);
  isLoading = signal(true);
  allData = signal<HistoryItem[]>([]);

  tabs = [
    { id: 'latest', label: 'Latest' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' }
  ];

  historyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M11.6667 1.66675V5.00008C11.6667 5.44211 11.8423 5.86603 12.1548 6.17859C12.4674 6.49115 12.8913 6.66675 13.3333 6.66675H16.6667M7.5 12.5001L9.16667 14.1667L12.5 10.8334M12.5 1.66675H5C4.55798 1.66675 4.13405 1.84234 3.82149 2.1549C3.50893 2.46746 3.33334 2.89139 3.33334 3.33341V16.6667C3.33334 17.1088 3.50893 17.5327 3.82149 17.8453C4.13405 18.1578 4.55798 18.3334 5 18.3334H15C15.442 18.3334 15.866 18.1578 16.1785 17.8453C16.4911 17.5327 16.6667 17.1088 16.6667 16.6667V5.83341L12.5 1.66675Z" stroke="#232323" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  columns = signal<TableColumn[]>([]);

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);

    this.dashboardService.getRecentOrders(30).subscribe({
      next: (orders) => {
        const items = this.mapToHistoryItems(orders);
        this.allData.set(items);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load history:', error);
        this.allData.set([]);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  private mapToHistoryItems(orders: DashboardOrder[]): HistoryItem[] {
    return orders.map(o => ({
      orderId: o.id,
      type: 'order' as HistoryType,
      dateCreated: this.formatDate(o.createdAt),
      internalReference: o.orderNumber || o.id.slice(0, 8),
      customerInitials: this.getInitials(o.user),
      customerName: this.getUserName(o.user),
      partsOrdered: (o.items || []).reduce((sum: number, item: { quantity: number }) => sum + (item.quantity || 0), 0),
      status: this.mapStatus(o.status)
    })).sort((a, b) => {
      const parse = (d: string) => { const [day, month, year] = d.split('-'); return new Date(Number(year), Number(month) - 1, Number(day)).getTime(); };
      return parse(b.dateCreated) - parse(a.dateCreated);
    });
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private getInitials(user: { firstName?: string; lastName?: string; email?: string } | undefined): string {
    if (!user) return 'U';
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    if (first || last) return (first + last).toUpperCase();
    return (user.email?.[0] || 'U').toUpperCase();
  }

  private getUserName(user: { firstName?: string; lastName?: string; email?: string } | undefined): string {
    if (!user) return 'Unknown';
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return name || user.email || 'Unknown';
  }

  private mapStatus(status: string): HistoryStatus {
    const s = (status || '').toLowerCase().replace(/_/g, '-') as HistoryStatus;
    const valid: HistoryStatus[] = ['draft', 'new', 'in-process', 'waiting-for-payment', 'ready-for-shipment', 'shipped', 'delivered', 'canceled', 'reversal'];
    if (valid.includes(s)) return s;
    if (s === 'cancelled') return 'canceled';
    return 'new';
  }

  ngAfterViewInit(): void {
    this.columns.set([
      { key: 'orderId', label: 'Order ID' },
      { key: 'type', label: 'Type', template: this.typeCell },
      { key: 'dateCreated', label: 'Date Created', sortable: true },
      { key: 'internalReference', label: 'Internal reference number' },
      { key: 'customer', label: 'Customer', template: this.customerCell },
      { key: 'partsOrdered', label: 'Parts ordered' },
      { key: 'status', label: 'Status', template: this.statusCell },
      { key: 'actions', label: '', template: this.actionsCell }
    ]);
  }

  get filteredData(): HistoryItem[] {
    const tab = this.activeTab();
    const data = this.allData();
    if (tab === 'completed') {
      return data.filter(item => item.status === 'delivered');
    } else if (tab === 'cancelled') {
      return data.filter(item => item.status === 'canceled' || item.status === 'reversal');
    }
    return data;
  }

  onTabChange(tabId: string): void {
    this.activeTab.set(tabId);
  }

  onSort(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
  }

  getTypeBadgeVariant(type: HistoryType): 'success' | 'info' {
    return type === 'order' ? 'success' : 'info';
  }

  getTypeLabel(type: HistoryType): string {
    return type === 'order' ? 'Order' : 'Manual';
  }

  getStatusBadgeVariant(status: HistoryStatus): 'success' | 'danger' | 'warning' | 'info' | 'secondary' {
    const variants: Record<HistoryStatus, 'success' | 'danger' | 'warning' | 'info' | 'secondary'> = {
      'draft': 'secondary',
      'new': 'info',
      'in-process': 'warning',
      'waiting-for-payment': 'warning',
      'ready-for-shipment': 'info',
      'shipped': 'info',
      'delivered': 'success',
      'canceled': 'danger',
      'reversal': 'danger'
    };
    return variants[status] || 'secondary';
  }

  getStatusLabel(status: HistoryStatus): string {
    const labels: Record<HistoryStatus, string> = {
      'draft': 'Draft',
      'new': 'New',
      'in-process': 'In Process',
      'waiting-for-payment': 'Waiting for Payment',
      'ready-for-shipment': 'Ready for Shipment',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'canceled': 'Cancelled',
      'reversal': 'Reversal'
    };
    return labels[status] || status;
  }

  tableActions: TableAction[] = [
    { id: 'view', label: 'View', icon: 'eye' },
    { id: 'archive', label: 'Archive', icon: 'archive' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  toggleMenu(rowId: string): void {
    this.openMenuRowId.set(this.openMenuRowId() === rowId ? null : rowId);
  }

  closeMenu(): void {
    this.openMenuRowId.set(null);
  }

  onActionClick(event: ActionClickEvent): void {
    const row = event.row as HistoryItem;
    this.closeMenu();
    switch (event.actionId) {
      case 'view':
        this.router.navigate(['/customer-admin/orders', row.orderId]);
        break;
      case 'archive':
        this.orderService.updateOrder(row.orderId, { isArchived: true } as Partial<Order>).subscribe({
          next: () => {
            this.allData.update(list => list.filter(o => o.orderId !== row.orderId));
            this.cdr.markForCheck();
          },
          error: (error) => console.error('Error archiving order:', error)
        });
        break;
      case 'delete':
        this.orderService.deleteOrder(row.orderId).subscribe({
          next: () => {
            this.allData.update(list => list.filter(o => o.orderId !== row.orderId));
            this.cdr.markForCheck();
          },
          error: (error) => console.error('Error deleting order:', error)
        });
        break;
    }
  }
}
