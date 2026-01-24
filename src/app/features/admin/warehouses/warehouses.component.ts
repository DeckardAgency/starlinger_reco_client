import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { 
  ListHeaderComponent,
  TableFooterComponent,
  TableActionsDropdownComponent,
  TableCheckboxSelectionComponent,
  TableAction
} from '@app/ui-kit/molecules';
import { ToggleComponent } from '@app/ui-kit/atoms/toggle/toggle.component';
import { Warehouse } from '@core/models/warehouse.model';

@Component({
  selector: 'app-warehouses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DataTableComponent,
    BreadcrumbsComponent,
    ListHeaderComponent,
    TableFooterComponent,
    TableActionsDropdownComponent,
    TableCheckboxSelectionComponent,
    ToggleComponent
  ],
  templateUrl: './warehouses.component.html',
  styleUrls: ['./warehouses.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WarehousesComponent implements AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('activeTemplate') activeTemplate!: TemplateRef<any>;
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
  
  // Header dropdown state
  isHeaderDropdownOpen = signal(false);

  // Selection state
  selectAll = signal(false);
  
  selectedCount = computed(() => this.warehouses().filter(w => w.selected).length);
  hasSelected = computed(() => this.selectedCount() > 0);

  // Table columns
  columns: TableColumn[] = [];

  // Table actions for dropdown
  tableActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(17);

  // Data
  warehouses = signal<Warehouse[]>([]);

  // Total count
  totalItems = computed(() => this.warehouses().length);

  constructor() {
    this.loadWarehouses();
  }

  private loadWarehouses(): void {
    this.isLoading.set(true);
    import('@core/mocks/mock-data').then(({ mockWarehouses }) => {
      this.warehouses.set(mockWarehouses.map(w => ({ ...w, selected: false })));
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
      { key: 'id', label: 'ID', sortable: false, width: '112px' },
      { key: 'name', label: 'Name', sortable: false },
      { key: 'address', label: 'Address', sortable: false },
      { key: 'city', label: 'City', sortable: false },
      { key: 'active', label: 'Active', sortable: false, width: '192px', template: this.activeTemplate },
      { key: 'actions', label: '', sortable: false, width: '64px', template: this.actionsTemplate }
    ];
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    console.log('Searching:', this.searchQuery);
  }

  onSortChange(event: SortEvent): void {
    this.sortColumn = event.column;
    this.sortDirection = event.direction;
  }

  onAddWarehouse(): void {
    this.router.navigate(['/admin/warehouses/new']);
  }

  toggleDropdown(warehouseId: string, event: Event | void): void {
    if (event) {
      (event as Event).stopPropagation();
    }
    if (this.openDropdownId() === warehouseId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(warehouseId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
    this.isHeaderDropdownOpen.set(false);
  }

  onActionClick(event: { action: TableAction; row: unknown }): void {
    const warehouse = event.row as Warehouse;
    switch (event.action.id) {
      case 'edit':
        this.onEdit(warehouse);
        break;
      case 'delete':
        this.onDelete(warehouse);
        break;
    }
  }

  onEdit(warehouse: Warehouse): void {
    this.router.navigate(['/admin/warehouses', warehouse.id]);
    this.closeDropdown();
  }

  onDelete(warehouse: Warehouse): void {
    console.log('Delete warehouse:', warehouse);
    this.closeDropdown();
  }

  onBulkDelete(): void {
    const selected = this.warehouses().filter(w => w.selected);
    console.log('Bulk delete warehouses:', selected);
    const remaining = this.warehouses().filter(w => !w.selected);
    this.warehouses.set(remaining);
    this.selectAll.set(false);
  }

  onHeaderDropdownToggle(isOpen: boolean): void {
    this.isHeaderDropdownOpen.set(isOpen);
    if (isOpen) {
      this.openDropdownId.set(null);
    }
  }

  onSelectAll(): void {
    const updated = this.warehouses().map(w => ({ ...w, selected: true }));
    this.warehouses.set(updated);
    this.selectAll.set(true);
  }

  onSelectNone(): void {
    const updated = this.warehouses().map(w => ({ ...w, selected: false }));
    this.warehouses.set(updated);
    this.selectAll.set(false);
  }

  toggleWarehouseSelection(warehouse: Warehouse): void {
    const updated = this.warehouses().map(w => 
      w.id === warehouse.id ? { ...w, selected: !w.selected } : w
    );
    this.warehouses.set(updated);
    this.selectAll.set(updated.every(w => w.selected));
  }

  toggleActive(warehouse: Warehouse, value: boolean): void {
    const updated = this.warehouses().map(w => 
      w.id === warehouse.id ? { ...w, active: value } : w
    );
    this.warehouses.set(updated);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }
}
