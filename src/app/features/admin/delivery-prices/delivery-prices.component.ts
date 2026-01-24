import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { DeliveryPrice } from '@core/models/delivery-price.model';

// Consolidated components
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { ListHeaderComponent } from '@app/ui-kit/molecules/list-header/list-header.component';
import { TableActionsDropdownComponent, TableAction } from '@app/ui-kit/molecules/table-actions-dropdown/table-actions-dropdown.component';
import { TableCheckboxSelectionComponent } from '@app/ui-kit/molecules/table-checkbox-selection/table-checkbox-selection.component';
import { TableFooterComponent } from '@app/ui-kit/molecules/table-footer/table-footer.component';

@Component({
  selector: 'app-delivery-prices',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DataTableComponent,
    BreadcrumbsComponent,
    ListHeaderComponent,
    TableActionsDropdownComponent,
    TableCheckboxSelectionComponent,
    TableFooterComponent
  ],
  templateUrl: './delivery-prices.component.html',
  styleUrls: ['./delivery-prices.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeliveryPricesComponent implements AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('priceTemplate') priceTemplate!: TemplateRef<any>;

  // Search state
  searchQuery = '';

  // Loading state
  isLoading = signal(false);

  // Sort state
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' | null = null;

  // Dropdown state
  openDropdownId = signal<string | null>(null);
  
  // Header dropdown state
  isHeaderDropdownOpen = signal(false);

  // Selection state
  selectAll = signal(false);
  
  selectedCount = computed(() => this.deliveryPrices().filter(dp => dp.selected).length);
  hasSelected = computed(() => this.selectedCount() > 0);

  // Table columns
  columns: TableColumn[] = [];

  // Table actions
  tableActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(17);

  // Data
  deliveryPrices = signal<DeliveryPrice[]>([]);

  // Total count
  totalItems = computed(() => this.deliveryPrices().length);

  constructor() {
    this.loadDeliveryPrices();
  }

  private loadDeliveryPrices(): void {
    this.isLoading.set(true);
    import('@core/mocks/mock-data').then(({ mockDeliveryPrices }) => {
      this.deliveryPrices.set(mockDeliveryPrices.map(dp => ({ ...dp, selected: false })));
      this.isLoading.set(false);
      this.cdr.markForCheck();
    });
  }

  ngAfterViewInit(): void {
    this.initColumns();
    this.cdr.detectChanges();
  }

  private initColumns(): void {
    this.columns = [
      { key: 'checkbox', label: '', sortable: false, width: '56px', template: this.checkboxTemplate, headerTemplate: this.checkboxHeaderTemplate },
      { key: 'id', label: 'ID', sortable: false, width: '80px' },
      { key: 'name', label: 'Name', sortable: false },
      { key: 'dhlZone', label: 'DHL zone', sortable: false },
      { key: 'deliveryType', label: 'Delivery type', sortable: false },
      { key: 'sizeFrom', label: 'Size from', sortable: false },
      { key: 'sizeTo', label: 'Size to', sortable: false },
      { key: 'priceBase', label: 'Price base', sortable: false, template: this.priceTemplate },
      { key: 'actions', label: '', sortable: false, width: '64px', template: this.actionsTemplate }
    ];
  }

  onSearchQueryChange(query: string): void {
    this.searchQuery = query;
    this.onSearch();
  }

  onSearch(): void {
    console.log('Searching:', this.searchQuery);
  }

  onSortChange(event: SortEvent): void {
    this.sortColumn = event.column;
    this.sortDirection = event.direction;
  }

  onAddDeliveryPrice(): void {
    this.router.navigate(['/admin/delivery-prices/new']);
  }

  toggleDropdown(deliveryPriceId: string): void {
    if (this.openDropdownId() === deliveryPriceId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(deliveryPriceId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
    this.isHeaderDropdownOpen.set(false);
  }

  onActionClick(event: { action: TableAction; row: unknown }): void {
    const deliveryPrice = event.row as DeliveryPrice;
    if (event.action.id === 'edit') {
      this.router.navigate(['/admin/delivery-prices', deliveryPrice.id]);
    } else if (event.action.id === 'delete') {
      console.log('Delete delivery price:', deliveryPrice);
    }
    this.closeDropdown();
  }

  onBulkDelete(): void {
    const selected = this.deliveryPrices().filter(dp => dp.selected);
    console.log('Bulk delete delivery prices:', selected);
    const remaining = this.deliveryPrices().filter(dp => !dp.selected);
    this.deliveryPrices.set(remaining);
    this.selectAll.set(false);
  }

  onHeaderDropdownToggle(isOpen: boolean): void {
    this.isHeaderDropdownOpen.set(isOpen);
    this.openDropdownId.set(null);
  }

  onSelectAll(): void {
    const updated = this.deliveryPrices().map(dp => ({ ...dp, selected: true }));
    this.deliveryPrices.set(updated);
    this.selectAll.set(true);
    this.isHeaderDropdownOpen.set(false);
  }

  onSelectNone(): void {
    const updated = this.deliveryPrices().map(dp => ({ ...dp, selected: false }));
    this.deliveryPrices.set(updated);
    this.selectAll.set(false);
    this.isHeaderDropdownOpen.set(false);
  }

  toggleDeliveryPriceSelection(deliveryPrice: DeliveryPrice): void {
    const updated = this.deliveryPrices().map(dp => 
      dp.id === deliveryPrice.id ? { ...dp, selected: !dp.selected } : dp
    );
    this.deliveryPrices.set(updated);
    this.selectAll.set(updated.every(dp => dp.selected));
  }

  formatPrice(value: number): string {
    return value.toFixed(2).replace('.', ',') + ' €';
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }
}
