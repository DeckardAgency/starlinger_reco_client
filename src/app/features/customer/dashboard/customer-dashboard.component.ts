import { Component, ChangeDetectionStrategy, ViewChild, TemplateRef, signal, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  SectionHeaderComponent,
  QuickActionCardComponent,
  QuickActionCardData,
  QuickActionType,
  OrderCardComponent,
  OrderCardData,
  OrderCardStatus,
  TabsComponent,
  BadgeComponent,
  ButtonComponent,
  DropdownMenuComponent,
  DropdownMenuItem
} from '@app/ui-kit';
import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { DashboardService, DashboardOrder } from '@core/services/http/dashboard.service';
import {
  HistoryItem,
  HistoryStatus,
  HistoryType,
  mockCustomerQuickActions,
  ICON_QUICK_ACTIONS,
  ICON_ACTIVE_ORDERS,
  ICON_HISTORY
} from '@core/mocks/mock-data';

// Contact form model
interface ContactFormData {
  subject: string;
  message: string;
  orderId: string;
  product: string;
  attachment: File | null;
  urgency: string;
}

@Component({
    selector: 'app-customer-dashboard',
    standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SectionHeaderComponent,
    QuickActionCardComponent,
    OrderCardComponent,
    TabsComponent,
    DataTableComponent,
    BadgeComponent,
    ButtonComponent,
    DropdownMenuComponent,
    IconComponent
  ],
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerDashboardComponent implements AfterViewInit, OnInit {
  private dashboardService = inject(DashboardService);
  private router = inject(Router);

  @ViewChild('typeCell', { static: true }) typeCell!: TemplateRef<any>;
  @ViewChild('statusCell', { static: true }) statusCell!: TemplateRef<any>;
  @ViewChild('actionsCell', { static: true }) actionsCell!: TemplateRef<any>;

  // Quick Actions section
  quickActionsIcon = ICON_QUICK_ACTIONS;
  quickActions: QuickActionCardData[] = mockCustomerQuickActions;

  // Contact Modal state
  showContactModal = signal(false);
  contactFormData: ContactFormData = {
    subject: '',
    message: '',
    orderId: '',
    product: '',
    attachment: null,
    urgency: ''
  };
  selectedFileName = signal<string>('');

  // Loading states
  isLoadingOrders = signal(true);
  isLoadingHistory = signal(true);

  // Active Orders section
  activeOrdersIcon = ICON_ACTIVE_ORDERS;
  activeOrders = signal<OrderCardData[]>([]);

  // History section
  historyIcon = ICON_HISTORY;

  activeTab = signal('latest');
  sortColumn = signal<string | null>('dateCreated');
  sortDirection = signal<'asc' | 'desc' | null>('desc');
  openMenuRowId = signal<string | null>(null);

  tabs = [
    { id: 'latest', label: 'Latest' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' }
  ];

  columns = signal<TableColumn[]>([]);

  historyData = signal<HistoryItem[]>([]);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.isLoadingOrders.set(true);
    this.isLoadingHistory.set(true);

    // Load recent orders
    this.dashboardService.getRecentOrders(10).subscribe({
      next: (orders) => {
        // Map orders to active orders format
        const activeOrderCards = this.mapOrdersToCards(orders);
        this.activeOrders.set(activeOrderCards);
        this.isLoadingOrders.set(false);

        // Map to history format
        const historyItems = this.mapToHistoryItems(orders);
        this.historyData.set(historyItems);
        this.isLoadingHistory.set(false);
      },
      error: (error) => {
        console.error('Failed to load dashboard data:', error);
        this.isLoadingOrders.set(false);
        this.isLoadingHistory.set(false);
      }
    });
  }

  private mapOrdersToCards(orders: DashboardOrder[]): OrderCardData[] {
    return orders
      .filter(o => !['delivered', 'canceled', 'reversal'].includes(o.status))
      .slice(0, 3)
      .map(order => ({
        id: order.orderNumber || order.id.slice(0, 8),
        orderId: order.id,
        type: 'order' as const,
        internalReference: order.orderNumber || order.id.slice(0, 8),
        dateCreated: this.formatDate(order.createdAt),
        partsOrdered: (order.items || []).reduce((sum: number, item: { quantity: number }) => sum + (item.quantity || 0), 0),
        status: this.normalizeStatus(order.status)
      }));
  }

  private mapToHistoryItems(orders: DashboardOrder[]): HistoryItem[] {
    return orders.map(order => ({
      id: order.id,
      orderId: order.orderNumber || order.id.slice(0, 4),
      type: 'order' as HistoryType,
      dateCreated: this.formatDate(order.createdAt),
      internalReference: order.orderNumber || order.id.slice(0, 8),
      partsOrdered: (order.items || []).reduce((sum: number, item: { quantity: number }) => sum + (item.quantity || 0), 0),
      status: this.mapToHistoryStatus(order.status)
    })).sort((a, b) =>
      new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
    );
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  }

  private normalizeStatus(status: string): OrderCardStatus {
    const s = (status || '').toLowerCase().replace(/_/g, '-') as OrderCardStatus;
    const valid: OrderCardStatus[] = ['draft', 'new', 'in-process', 'waiting-for-payment', 'ready-for-shipment', 'shipped', 'delivered', 'canceled', 'reversal'];
    if (valid.includes(s)) return s;
    return 'new';
  }

  private mapToHistoryStatus(status: string): HistoryStatus {
    const raw = (status || '').toLowerCase().replace(/_/g, '-');
    if (raw === 'cancelled') return 'canceled';
    const valid: HistoryStatus[] = ['draft', 'new', 'in-process', 'waiting-for-payment', 'ready-for-shipment', 'shipped', 'delivered', 'canceled', 'reversal'];
    if (valid.includes(raw as HistoryStatus)) return raw as HistoryStatus;
    return 'new';
  }

  ngAfterViewInit(): void {
    // Set columns without Customer column for Customer view
    this.columns.set([
      { key: 'orderId', label: 'Order ID' },
      { key: 'type', label: 'Type', template: this.typeCell },
      { key: 'dateCreated', label: 'Date Created', sortable: true },
      { key: 'internalReference', label: 'Internal reference number' },
      { key: 'partsOrdered', label: 'Parts ordered' },
      { key: 'status', label: 'Status', template: this.statusCell },
      { key: 'actions', label: '', template: this.actionsCell }
    ]);
  }

  get filteredData(): HistoryItem[] {
    const tab = this.activeTab();
    const data = this.historyData();
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

  dropdownMenuItems: DropdownMenuItem[] = [
    {
      id: 'view',
      label: 'View',
      icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0.666687 8.00008C0.666687 8.00008 3.33335 2.66675 8.00002 2.66675C12.6667 2.66675 15.3334 8.00008 15.3334 8.00008C15.3334 8.00008 12.6667 13.3334 8.00002 13.3334C3.33335 13.3334 0.666687 8.00008 0.666687 8.00008Z" stroke="#232323" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke="#232323" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 5.33325V13.9999C14 14.3535 13.8595 14.6927 13.6095 14.9427C13.3594 15.1928 13.0203 15.3333 12.6667 15.3333H3.33333C2.97971 15.3333 2.64057 15.1928 2.39052 14.9427C2.14048 14.6927 2 14.3535 2 13.9999V5.33325M6 7.99992H10M0.666667 2.66659H15.3333V5.33325H0.666667V2.66659Z" stroke="#232323" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
    }
  ];

  toggleMenu(rowId: string): void {
    this.openMenuRowId.set(this.openMenuRowId() === rowId ? null : rowId);
  }

  closeMenu(): void {
    this.openMenuRowId.set(null);
  }

  onMenuItemClick(itemId: string, row: HistoryItem): void {
    this.closeMenu();
    switch (itemId) {
      case 'view':
        this.router.navigate(['/customer/orders', row.id]);
        break;
      case 'archive':
        // Archive the item
        break;
    }
  }

  // Quick Action handlers
  onQuickActionClick(type: QuickActionType): void {
    if (type === 'contact-sales') {
      this.openContactModal();
    }
  }

  // Contact Modal methods
  openContactModal(): void {
    this.resetContactForm();
    this.showContactModal.set(true);
  }

  closeContactModal(): void {
    this.showContactModal.set(false);
    this.resetContactForm();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.contactFormData.attachment = input.files[0];
      this.selectedFileName.set(input.files[0].name);
    }
  }

  onSendMessage(): void {
    console.log('Sending message:', this.contactFormData);
    // Here you would typically send the data to an API
    this.closeContactModal();
  }

  private resetContactForm(): void {
    this.contactFormData = {
      subject: '',
      message: '',
      orderId: '',
      product: '',
      attachment: null,
      urgency: ''
    };
    this.selectedFileName.set('');
  }
}
