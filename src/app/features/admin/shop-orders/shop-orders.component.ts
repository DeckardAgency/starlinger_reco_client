import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';
import { AvatarComponent } from '@app/ui-kit/atoms/avatar/avatar.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { TabsComponent, TabItem } from '@app/ui-kit/molecules/tabs/tabs.component';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { ListHeaderComponent } from '@app/ui-kit/molecules/list-header/list-header.component';
import { TableFooterComponent } from '@app/ui-kit/molecules/table-footer/table-footer.component';
import { TableActionsDropdownComponent, TableAction, ActionClickEvent } from '@app/ui-kit/molecules/table-actions-dropdown/table-actions-dropdown.component';
import { mockShopOrders } from '@core/mocks/mock-data';

interface ShopOrder {
  id: string;
  type: 'order' | 'manual';
  dateCreated: string;
  internalRef: string;
  customer: {
    name: string;
    initials: string;
    avatar?: string;
  };
  partsOrdered: number;
  status: 'completed' | 'cancelled' | 'pending';
}

@Component({
  selector: 'app-shop-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DataTableComponent,
    BadgeComponent,
    AvatarComponent,
    IconComponent,
    TabsComponent,
    BreadcrumbsComponent,
    ListHeaderComponent,
    TableFooterComponent,
    TableActionsDropdownComponent
  ],
  templateUrl: './shop-orders.component.html',
  styleUrls: ['./shop-orders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShopOrdersComponent implements AfterViewInit {
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

  // Table actions
  tableActions: TableAction[] = [
    { id: 'view', label: 'View', icon: 'eye' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  // Data from centralized mock file
  allOrders = signal<ShopOrder[]>(mockShopOrders as ShopOrder[]);

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
    this.searchQuery = query;
    console.log('Searching:', this.searchQuery);
  }

  onSortChange(event: SortEvent): void {
    this.sortColumn = event.column;
    this.sortDirection = event.direction;
    console.log('Sorting by:', event.column, event.direction);
  }

  onExport(): void {
    console.log('Exporting data...');
  }

  toggleDropdown(orderId: string): void {
    if (this.openDropdownId() === orderId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(orderId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
  }

  onActionClick(event: ActionClickEvent): void {
    const order = event.row as ShopOrder;
    switch (event.actionId) {
      case 'view':
        this.onView(order);
        break;
      case 'delete':
        this.onDelete(order);
        break;
    }
  }

  onView(order: ShopOrder): void {
    console.log('View order:', order);
    this.router.navigate(['/admin/shop-orders', order.id]);
    this.closeDropdown();
  }

  onDelete(order: ShopOrder): void {
    console.log('Delete order:', order);
    this.closeDropdown();
  }

  getTypeLabel(type: string): string {
    return type === 'order' ? 'Order' : 'Manual';
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
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  }
}
