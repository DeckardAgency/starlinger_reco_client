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
import { TaxType } from '@core/models/tax-type.model';

@Component({
  selector: 'app-tax-types',
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
    TableCheckboxSelectionComponent
  ],
  templateUrl: './tax-types.component.html',
  styleUrls: ['./tax-types.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaxTypesComponent implements AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('percentTemplate') percentTemplate!: TemplateRef<any>;
  @ViewChild('remoteCodeTemplate') remoteCodeTemplate!: TemplateRef<any>;
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
  
  // Computed: selected tax types count
  selectedCount = computed(() => this.taxTypes().filter(t => t.selected).length);
  
  // Computed: has any selected
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

  // Data loaded from mock interceptor
  taxTypes = signal<TaxType[]>([]);

  // Total count
  totalItems = computed(() => this.taxTypes().length);

  constructor() {
    this.loadTaxTypes();
  }

  private loadTaxTypes(): void {
    this.isLoading.set(true);
    import('@core/mocks/mock-data').then(({ mockTaxTypes }) => {
      this.taxTypes.set(mockTaxTypes.map(t => ({ ...t, selected: false })));
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
      { key: 'percent', label: 'Percent', sortable: false, width: '192px', template: this.percentTemplate },
      { key: 'remoteId', label: 'Remote id', sortable: false, width: '192px' },
      { key: 'remoteCode', label: 'Remote code', sortable: false, width: '192px', template: this.remoteCodeTemplate },
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

  onAddTaxType(): void {
    this.router.navigate(['/admin/tax-types/new']);
  }

  toggleDropdown(taxTypeId: string): void {
    if (this.openDropdownId() === taxTypeId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(taxTypeId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
    this.isHeaderDropdownOpen.set(false);
  }

  onActionClick(event: { action: TableAction; row: unknown }): void {
    const taxType = event.row as TaxType;
    switch (event.action.id) {
      case 'edit':
        this.onEdit(taxType);
        break;
      case 'delete':
        this.onDelete(taxType);
        break;
    }
  }

  onEdit(taxType: TaxType): void {
    this.router.navigate(['/admin/tax-types', taxType.id]);
    this.closeDropdown();
  }

  onDelete(taxType: TaxType): void {
    console.log('Delete tax type:', taxType);
    this.closeDropdown();
  }

  onBulkDelete(): void {
    const selected = this.taxTypes().filter(t => t.selected);
    console.log('Bulk delete tax types:', selected);
    const remaining = this.taxTypes().filter(t => !t.selected);
    this.taxTypes.set(remaining);
    this.selectAll.set(false);
  }

  onHeaderDropdownToggle(isOpen: boolean): void {
    this.isHeaderDropdownOpen.set(isOpen);
    if (isOpen) {
      this.openDropdownId.set(null);
    }
  }

  onSelectAll(): void {
    const updated = this.taxTypes().map(t => ({ ...t, selected: true }));
    this.taxTypes.set(updated);
    this.selectAll.set(true);
  }

  onSelectNone(): void {
    const updated = this.taxTypes().map(t => ({ ...t, selected: false }));
    this.taxTypes.set(updated);
    this.selectAll.set(false);
  }

  toggleTaxTypeSelection(taxType: TaxType): void {
    const updated = this.taxTypes().map(t => 
      t.id === taxType.id ? { ...t, selected: !t.selected } : t
    );
    this.taxTypes.set(updated);
    this.selectAll.set(updated.every(t => t.selected));
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  formatPercent(value: number): string {
    return value.toFixed(2).replace('.', ',');
  }
}
