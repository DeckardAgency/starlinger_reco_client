import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';
import { mockAdminDiscounts, AdminDiscount } from '@core/mocks/mock-data';

// Consolidated components
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { ListHeaderComponent } from '@app/ui-kit/molecules/list-header/list-header.component';
import { TableActionsDropdownComponent, TableAction } from '@app/ui-kit/molecules/table-actions-dropdown/table-actions-dropdown.component';
import { TableCheckboxSelectionComponent } from '@app/ui-kit/molecules/table-checkbox-selection/table-checkbox-selection.component';
import { TableFooterComponent } from '@app/ui-kit/molecules/table-footer/table-footer.component';

type Discount = AdminDiscount;

@Component({
  selector: 'app-discounts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DataTableComponent,
    BadgeComponent,
    BreadcrumbsComponent,
    ListHeaderComponent,
    TableActionsDropdownComponent,
    TableCheckboxSelectionComponent,
    TableFooterComponent
  ],
  templateUrl: './discounts.component.html',
  styleUrls: ['./discounts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiscountsComponent implements AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
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
  
  // Header dropdown state (for select all)
  isHeaderDropdownOpen = signal(false);

  // Selection state
  selectAll = signal(false);
  
  // Computed: selected discounts count
  selectedCount = computed(() => this.discounts().filter(d => d.selected).length);
  
  // Computed: has any selected
  hasSelected = computed(() => this.selectedCount() > 0);

  // Table columns
  columns: TableColumn[] = [];

  // Table actions
  tableActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'clone', label: 'Clone', icon: 'copy' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  // Data from centralized mock data
  discounts = signal<Discount[]>(mockAdminDiscounts.map(d => ({ ...d })));

  // Total count
  totalCount = computed(() => this.discounts().length);

  ngAfterViewInit(): void {
    this.initColumns();
    this.cdr.detectChanges();
  }

  private initColumns(): void {
    this.columns = [
      { key: 'checkbox', label: '', sortable: false, width: '56px', template: this.checkboxTemplate, headerTemplate: this.checkboxHeaderTemplate },
      { key: 'id', label: 'Id', sortable: false, width: '68px' },
      { key: 'name', label: 'Name', sortable: false },
      { key: 'status', label: 'Status', sortable: false, width: '96px', template: this.statusTemplate },
      { key: 'priority', label: 'Priority', sortable: false, width: '96px' },
      { key: 'dateValidFrom', label: 'Date valid from', sortable: false, width: '180px' },
      { key: 'dateValidTo', label: 'Date valid to', sortable: false, width: '180px' },
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
    console.log('Sorting by:', event.column, event.direction);
  }

  onAddDiscount(): void {
    this.router.navigate(['/admin/discounts/new']);
  }

  toggleDropdown(discountId: string): void {
    if (this.openDropdownId() === discountId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(discountId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
    this.isHeaderDropdownOpen.set(false);
  }

  onActionClick(event: { action: TableAction; row: unknown }): void {
    const discount = event.row as Discount;
    if (event.action.id === 'edit') {
      this.router.navigate(['/admin/discounts', discount.id]);
    } else if (event.action.id === 'clone') {
      console.log('Clone discount:', discount);
    } else if (event.action.id === 'delete') {
      console.log('Delete discount:', discount);
    }
    this.closeDropdown();
  }

  onBulkDelete(): void {
    const selected = this.discounts().filter(d => d.selected);
    console.log('Bulk delete discounts:', selected);
    // Remove selected discounts (mock implementation)
    const remaining = this.discounts().filter(d => !d.selected);
    this.discounts.set(remaining);
    this.selectAll.set(false);
  }

  onHeaderDropdownToggle(isOpen: boolean): void {
    this.isHeaderDropdownOpen.set(isOpen);
    this.openDropdownId.set(null);
  }

  onSelectAll(): void {
    const updated = this.discounts().map(d => ({ ...d, selected: true }));
    this.discounts.set(updated);
    this.selectAll.set(true);
    this.isHeaderDropdownOpen.set(false);
  }

  onSelectNone(): void {
    const updated = this.discounts().map(d => ({ ...d, selected: false }));
    this.discounts.set(updated);
    this.selectAll.set(false);
    this.isHeaderDropdownOpen.set(false);
  }

  toggleDiscountSelection(discount: Discount): void {
    const updated = this.discounts().map(d => 
      d.id === discount.id ? { ...d, selected: !d.selected } : d
    );
    this.discounts.set(updated);
    // Update selectAll based on all discounts being selected
    this.selectAll.set(updated.every(d => d.selected));
  }
}
