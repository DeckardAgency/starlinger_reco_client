import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { ListHeaderComponent } from '@app/ui-kit/molecules/list-header/list-header.component';
import { TableFooterComponent } from '@app/ui-kit/molecules/table-footer/table-footer.component';
import { TableCheckboxSelectionComponent } from '@app/ui-kit/molecules/table-checkbox-selection/table-checkbox-selection.component';
import { TableActionsDropdownComponent, TableAction, ActionClickEvent } from '@app/ui-kit/molecules/table-actions-dropdown/table-actions-dropdown.component';
import { mockAdminProducts } from '@core/mocks/mock-data';

interface Product {
  id: string;
  code: string;
  name: string;
  shortDescription: string;
  qty: number;
  qtyStep: number;
  selected?: boolean;
}

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DataTableComponent,
    IconComponent,
    BreadcrumbsComponent,
    ListHeaderComponent,
    TableFooterComponent,
    TableCheckboxSelectionComponent,
    TableActionsDropdownComponent
  ],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsComponent implements AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
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
  
  // Header dropdown state (for select all)
  isHeaderDropdownOpen = signal(false);

  // Selection state
  selectAll = signal(false);
  
  // Computed: selected products count
  selectedCount = computed(() => this.products().filter(p => p.selected).length);
  
  // Computed: has any selected
  hasSelected = computed(() => this.selectedCount() > 0);

  // Table columns
  columns: TableColumn[] = [];

  // Table actions
  tableActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'edit' },
    { id: 'clone', label: 'Clone', icon: 'copy' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  // Data from centralized mock file
  products = signal<Product[]>(mockAdminProducts.map(p => ({ ...p, selected: false })) as Product[]);

  // Total count
  totalCount = computed(() => this.products().length);

  ngAfterViewInit(): void {
    this.initColumns();
    this.cdr.detectChanges();
  }

  private initColumns(): void {
    this.columns = [
      { key: 'checkbox', label: '', sortable: false, width: '56px', template: this.checkboxTemplate, headerTemplate: this.checkboxHeaderTemplate },
      { key: 'id', label: 'Product ID', sortable: false, width: '112px' },
      { key: 'code', label: 'Code', sortable: false, width: '128px' },
      { key: 'name', label: 'Name', sortable: true, width: '266px' },
      { key: 'shortDescription', label: 'Short description', sortable: false },
      { key: 'qty', label: 'Qty', sortable: false, width: '96px' },
      { key: 'qtyStep', label: 'Qty step', sortable: false, width: '96px' },
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
    console.log('Sorting by:', event.column, event.direction);
  }

  onExport(): void {
    console.log('Exporting data...');
  }

  onAddProduct(): void {
    console.log('Adding new product...');
    this.router.navigate(['/admin/products/new']);
  }

  toggleDropdown(productId: string): void {
    if (this.openDropdownId() === productId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(productId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
    this.isHeaderDropdownOpen.set(false);
  }

  onActionClick(event: ActionClickEvent): void {
    const product = event.row as Product;
    switch (event.actionId) {
      case 'edit':
        this.onEdit(product);
        break;
      case 'clone':
        this.onClone(product);
        break;
      case 'delete':
        this.onDelete(product);
        break;
    }
  }

  onEdit(product: Product): void {
    console.log('Edit product:', product);
    this.router.navigate(['/admin/products', product.id]);
    this.closeDropdown();
  }

  onClone(product: Product): void {
    console.log('Clone product:', product);
    this.closeDropdown();
  }

  onDelete(product: Product): void {
    console.log('Delete product:', product);
    this.closeDropdown();
  }

  onBulkDelete(): void {
    const selected = this.products().filter(p => p.selected);
    console.log('Bulk delete products:', selected);
    const remaining = this.products().filter(p => !p.selected);
    this.products.set(remaining);
    this.selectAll.set(false);
  }

  onHeaderDropdownToggle(isOpen: boolean): void {
    this.isHeaderDropdownOpen.set(isOpen);
    this.openDropdownId.set(null);
  }

  onSelectAll(): void {
    const updated = this.products().map(p => ({ ...p, selected: true }));
    this.products.set(updated);
    this.selectAll.set(true);
    this.isHeaderDropdownOpen.set(false);
  }

  onSelectNone(): void {
    const updated = this.products().map(p => ({ ...p, selected: false }));
    this.products.set(updated);
    this.selectAll.set(false);
    this.isHeaderDropdownOpen.set(false);
  }

  toggleProductSelection(product: Product): void {
    const updated = this.products().map(p => 
      p.id === product.id ? { ...p, selected: !p.selected } : p
    );
    this.products.set(updated);
    this.selectAll.set(updated.every(p => p.selected));
  }
}
