import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

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
import { mockOrderHistory, OrderHistoryItem } from '@core/mocks/mock-data';

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
export class OrdersComponent implements AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('typeTemplate') typeTemplate!: TemplateRef<any>;
  @ViewChild('customerTemplate') customerTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  // Search state
  searchQuery = '';

  // Loading state
  isLoading = signal(false);

  // Sort state
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' | null = null;

  // Dropdown state
  openDropdownId = signal<string | null>(null);

  // Active tab
  activeTab = signal('latest');

  // Tabs configuration
  tabs: TabItem[] = [
    { id: 'latest', label: 'Latest' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' }
  ];

  // Table columns
  columns: TableColumn[] = [];

  // Table actions for dropdown
  tableActions: TableAction[] = [
    { id: 'view', label: 'View', icon: 'eye' },
    { id: 'archive', label: 'Archive', icon: 'archive' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  // Use centralized mock data
  allOrders = signal<OrderHistoryItem[]>([...mockOrderHistory]);

  // Filtered orders based on active tab
  orders = computed(() => {
    const tab = this.activeTab();
    const all = this.allOrders();

    if (tab === 'completed') {
      return all.filter(o => o.status === 'completed');
    } else if (tab === 'cancelled') {
      return all.filter(o => o.status === 'cancelled');
    }
    // 'latest' shows all
    return all;
  });

  // Total count
  totalCount = computed(() => this.allOrders().length);

  ngAfterViewInit(): void {
    this.initColumns();
    this.cdr.detectChanges();
  }

  private initColumns(): void {
    this.columns = [
      { key: 'id', label: 'Inquiry ID', sortable: true, width: '112px' },
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
    this.searchQuery = query;
    this.cdr.markForCheck();
  }

  onSortChange(event: SortEvent): void {
    this.sortColumn = event.column;
    this.sortDirection = event.direction;
  }

  onExport(): void {
    console.log('Exporting data...');
  }

  toggleDropdown(orderId: string, event?: Event): void {
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
      case 'archive':
        this.onArchive(order);
        break;
      case 'delete':
        this.onDelete(order);
        break;
    }
  }

  onView(order: OrderHistoryItem): void {
    this.router.navigate(['/customer-admin/orders', order.id]);
    this.closeDropdown();
  }

  onArchive(order: OrderHistoryItem): void {
    console.log('Archive order:', order);
    this.closeDropdown();
  }

  onDelete(order: OrderHistoryItem): void {
    console.log('Delete order:', order);
    this.closeDropdown();
  }

  getTypeLabel(type: string): string {
    return type === 'order' ? 'Order' : 'Inquiry';
  }

  getTypeVariant(type: string): 'dark' | 'secondary' {
    return 'dark';
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'pending': return 'Pending';
      default: return status;
    }
  }

  getStatusVariant(status: string): 'success' | 'danger' | 'warning' | 'secondary' {
    switch (status) {
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      case 'pending': return 'success';
      default: return 'secondary';
    }
  }
}
