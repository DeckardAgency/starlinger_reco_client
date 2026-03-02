import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';
import { AvatarComponent } from '@app/ui-kit/atoms/avatar/avatar.component';
import { TabsComponent, TabItem } from '@app/ui-kit/molecules/tabs/tabs.component';
import {
  ListHeaderComponent,
  TableFooterComponent,
  TableActionsDropdownComponent,
  TableAction
} from '@app/ui-kit/molecules';
import { OrderService } from '@core/services/http/order.service';
import { CartService } from '@core/services/cart.service';
import { AlertService } from '@core/services/alert.service';
import { Order } from '@core/models/order.model';

// Display interface for the data table
interface OrderHistoryItem {
  id: number;
  type: 'order';
  dateCreated: string;
  internalRef: string;
  customer: {
    name: string;
    initials: string;
    avatar?: string;
  };
  partsOrdered: number;
  status: 'completed' | 'cancelled' | 'pending' | 'draft';
}

@Component({
  selector: 'app-customer-admin-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DataTableComponent,
    BreadcrumbsComponent,
    BadgeComponent,
    AvatarComponent,
    TabsComponent,
    ListHeaderComponent,
    TableFooterComponent,
    TableActionsDropdownComponent
  ],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersComponent implements AfterViewInit, OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private orderService = inject(OrderService);
  private cartService = inject(CartService);
  private alertService = inject(AlertService);

  @ViewChild('typeTemplate') typeTemplate!: TemplateRef<any>;
  @ViewChild('customerTemplate') customerTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  // Search state
  searchQuery = signal('');

  // Loading state
  isLoading = signal(true);

  // Sort state
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' | null = null;

  // Dropdown state
  openDropdownId = signal<number | null>(null);

  // Route-based filter context
  private routeFilter = signal<string | null>(null);

  // Active tab
  activeTab = signal('latest');

  // Tabs configuration - set based on route context
  tabs = signal<TabItem[]>([
    { id: 'latest', label: 'Latest' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' }
  ]);

  // Table columns
  columns: TableColumn[] = [];

  // Table actions for dropdown (set dynamically based on route context)
  tableActions: TableAction[] = [];

  // Data from API
  allOrders = signal<OrderHistoryItem[]>([]);

  // Filtered orders based on active tab, route context and search
  orders = computed(() => {
    const tab = this.activeTab();
    const all = this.allOrders();
    const filter = this.routeFilter();
    const query = this.searchQuery().toLowerCase().trim();

    let filtered: OrderHistoryItem[];

    // Route-level filtering
    if (filter === 'archive') {
      if (tab === 'completed') filtered = all.filter(o => o.status === 'completed');
      else if (tab === 'cancelled') filtered = all.filter(o => o.status === 'cancelled');
      else filtered = all.filter(o => o.status === 'completed' || o.status === 'cancelled');
    } else if (filter === 'drafts') {
      filtered = all.filter(o => o.status === 'draft');
    } else if (tab === 'completed') {
      filtered = all.filter(o => o.status === 'completed');
    } else if (tab === 'cancelled') {
      filtered = all.filter(o => o.status === 'cancelled');
    } else if (!filter) {
      filtered = all.filter(o => o.status === 'pending');
    } else {
      filtered = all;
    }

    // Apply search
    if (query) {
      filtered = filtered.filter(o =>
        String(o.id).toLowerCase().includes(query) ||
        o.internalRef.toLowerCase().includes(query) ||
        o.customer.name.toLowerCase().includes(query) ||
        o.dateCreated.includes(query) ||
        o.status.includes(query)
      );
    }

    return filtered;
  });

  // Total count
  totalCount = computed(() => this.orders().length);

  // Page title based on route context
  pageTitle = computed(() => {
    const filter = this.routeFilter();
    if (filter === 'archive') return 'Archive';
    if (filter === 'drafts') return 'Drafts';
    if (filter === 'bin') return 'Bin';
    return 'Orders';
  });

  // Home route based on current URL context
  homeRoute = computed(() => {
    return this.router.url.startsWith('/customer-admin') ? '/customer-admin/orders' : '/customer/orders';
  });

  ngOnInit(): void {
    const filter = this.route.snapshot.data['filter'] as string | undefined;
    this.routeFilter.set(filter || null);

    // Configure table actions based on route
    if (filter === 'drafts') {
      this.tableActions = [
        { id: 'view', label: 'View', icon: 'eye' },
        { id: 'add-to-cart', label: 'Add to Cart', icon: 'cart' },
        { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
      ];
    } else {
      this.tableActions = [
        { id: 'view', label: 'View', icon: 'eye' },
        { id: 'archive', label: 'Archive', icon: 'archive' },
        { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
      ];
    }

    // Configure tabs based on route
    if (filter === 'archive') {
      this.tabs.set([
        { id: 'all', label: 'All' },
        { id: 'completed', label: 'Completed' },
        { id: 'cancelled', label: 'Cancelled' }
      ]);
      this.activeTab.set('all');
    } else if (filter === 'drafts') {
      this.tabs.set([
        { id: 'drafts', label: 'Drafts' }
      ]);
      this.activeTab.set('drafts');
    } else {
      this.tabs.set([
        { id: 'latest', label: 'Latest' },
        { id: 'completed', label: 'Completed' },
        { id: 'cancelled', label: 'Cancelled' }
      ]);
      this.activeTab.set('latest');
    }

    this.loadData();
  }

  ngAfterViewInit(): void {
    this.initColumns();
    this.cdr.detectChanges();
  }

  private loadData(): void {
    this.isLoading.set(true);

    this.orderService.getOrders().subscribe({
      next: (response) => {
        const orderItems = response.orders.map(order => this.mapOrderToHistoryItem(order));

        // Sort by date (newest first)
        const sorted = orderItems.sort((a, b) => {
          return this.parseDate(b.dateCreated).getTime() - this.parseDate(a.dateCreated).getTime();
        });

        this.allOrders.set(sorted);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load orders:', error);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  private mapOrderToHistoryItem(order: Order): OrderHistoryItem {
    const userName = order.user ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() : 'Unknown';
    const initials = this.getInitials(userName);

    return {
      id: order.id,
      type: 'order',
      dateCreated: this.formatDate(order.createdAt),
      internalRef: String(order.orderNumber || order.id),
      customer: {
        name: userName,
        initials
      },
      partsOrdered: order.items?.length || 0,
      status: this.mapOrderStatus(order.status, order.isDraft)
    };
  }

  private getInitials(name: string): string {
    if (!name || name === 'Unknown') return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private parseDate(dateStr: string): Date {
    // Parse DD-MM-YYYY format
    const [day, month, year] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private mapOrderStatus(status: string, isDraft?: boolean): 'completed' | 'cancelled' | 'pending' | 'draft' {
    if (isDraft || (status || '').toLowerCase() === 'draft') return 'draft';
    const lowerStatus = (status || '').toLowerCase();
    if (lowerStatus === 'completed' || lowerStatus === 'delivered') return 'completed';
    if (lowerStatus === 'cancelled' || lowerStatus === 'canceled') return 'cancelled';
    return 'pending';
  }

  private initColumns(): void {
    this.columns = [
      { key: 'id', label: 'Order ID', sortable: true, width: '112px' },
      { key: 'type', label: 'Type', sortable: false, width: '128px', template: this.typeTemplate },
      { key: 'dateCreated', label: 'Date Created', sortable: true, width: '190px' },
      { key: 'internalRef', label: 'Internal reference number', sortable: false },
      { key: 'customer', label: 'Customer', sortable: false, template: this.customerTemplate },
      { key: 'partsOrdered', label: 'Parts ordered', sortable: false, width: '128px' },
      { key: 'status', label: 'Status', sortable: false, width: '128px', template: this.statusTemplate },
      { key: 'actions', label: '', sortable: false, width: '64px', template: this.actionsTemplate }
    ];
  }

  onTabChange(tabId: string): void {
    this.activeTab.set(tabId);
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
  }

  onSortChange(event: SortEvent): void {
    this.sortColumn = event.column;
    this.sortDirection = event.direction;
  }

  onExport(): void {
    console.log('Exporting data...');
  }

  toggleDropdown(orderId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.openDropdownId() === orderId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(orderId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
  }

  onActionClick(event: { action: TableAction; row: unknown }): void {
    const order = event.row as OrderHistoryItem;
    switch (event.action.id) {
      case 'view':
        this.onView(order);
        break;
      case 'add-to-cart':
        this.onAddToCart(order);
        break;
      case 'archive':
        this.onArchive(order);
        break;
      case 'delete':
        this.onDelete(order);
        break;
    }
  }

  onView(order: OrderHistoryItem): void {
    // Navigate to the correct detail route based on current context
    const basePath = this.router.url.startsWith('/customer-admin') ? '/customer-admin/orders' : '/customer/orders';
    this.router.navigate([basePath, order.id]);
    this.closeDropdown();
  }

  onAddToCart(order: OrderHistoryItem): void {
    this.closeDropdown();
    this.orderService.getOrder(String(order.id)).subscribe({
      next: (fullOrder) => {
        this.cartService.loadFromDraft(fullOrder);
        this.router.navigate(['/customer/shop/products']);
        this.cartService.openCart();
      },
      error: (error) => console.error('Error loading draft order:', error)
    });
  }

  async onArchive(order: OrderHistoryItem): Promise<void> {
    this.closeDropdown();
    const reason = await this.alertService.prompt(
      `Please provide a reason for canceling order "${order.internalRef}".`,
      'Cancel Order',
      'Enter cancellation reason...'
    );
    if (!reason) {
      return;
    }
    this.orderService.updateOrder(String(order.id), { status: 'canceled', cancellationReason: reason } as Partial<Order>).subscribe({
      next: () => {
        this.allOrders.update(list => list.filter(o => o.id !== order.id));
        this.cdr.markForCheck();
      },
      error: (error) => console.error('Error archiving order:', error)
    });
  }

  async onDelete(order: OrderHistoryItem): Promise<void> {
    const confirmed = await this.alertService.confirm(
      `Are you sure you want to delete order "${order.internalRef}"?`,
      'Delete'
    );
    if (!confirmed) {
      this.closeDropdown();
      return;
    }
    this.orderService.deleteOrder(String(order.id)).subscribe({
      next: () => {
        this.allOrders.update(list => list.filter(o => o.id !== order.id));
        this.cdr.markForCheck();
      },
      error: (error) => console.error('Error deleting order:', error)
    });
    this.closeDropdown();
  }

  getTypeLabel(type: string): string {
    return 'Order';
  }

  getTypeVariant(type: string): 'dark' | 'secondary' {
    return 'dark';
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'pending': return 'Pending';
      case 'draft': return 'Draft';
      default: return status;
    }
  }

  getStatusVariant(status: string): 'success' | 'danger' | 'warning' | 'secondary' {
    switch (status) {
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      case 'pending': return 'success';
      case 'draft': return 'secondary';
      default: return 'secondary';
    }
  }
}
