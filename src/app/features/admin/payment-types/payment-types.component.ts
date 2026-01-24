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
import { PaymentType } from '@core/models/payment-type.model';

@Component({
  selector: 'app-payment-types',
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
  templateUrl: './payment-types.component.html',
  styleUrls: ['./payment-types.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentTypesComponent implements AfterViewInit {
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

  selectedCount = computed(() => this.paymentTypes().filter(p => p.selected).length);
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
  paymentTypes = signal<PaymentType[]>([]);

  // Total count
  totalItems = computed(() => this.paymentTypes().length);

  constructor() {
    this.loadPaymentTypes();
  }

  private loadPaymentTypes(): void {
    this.isLoading.set(true);
    import('@core/mocks/mock-data').then(({ mockPaymentTypes }) => {
      this.paymentTypes.set(mockPaymentTypes.map(p => ({ ...p, selected: false })));
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

  onAddPaymentType(): void {
    this.router.navigate(['/admin/payment-types/new']);
  }

  toggleDropdown(paymentTypeId: string): void {
    if (this.openDropdownId() === paymentTypeId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(paymentTypeId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
    this.isHeaderDropdownOpen.set(false);
  }

  onActionClick(event: { action: TableAction; row: unknown }): void {
    const paymentType = event.row as PaymentType;
    switch (event.action.id) {
      case 'edit':
        this.onEdit(paymentType);
        break;
      case 'delete':
        this.onDelete(paymentType);
        break;
    }
  }

  onEdit(paymentType: PaymentType): void {
    this.router.navigate(['/admin/payment-types', paymentType.id]);
    this.closeDropdown();
  }

  onDelete(paymentType: PaymentType): void {
    console.log('Delete payment type:', paymentType);
    this.closeDropdown();
  }

  onBulkDelete(): void {
    const selected = this.paymentTypes().filter(p => p.selected);
    console.log('Bulk delete payment types:', selected);
    const remaining = this.paymentTypes().filter(p => !p.selected);
    this.paymentTypes.set(remaining);
    this.selectAll.set(false);
  }

  onHeaderDropdownToggle(isOpen: boolean): void {
    this.isHeaderDropdownOpen.set(isOpen);
    if (isOpen) {
      this.openDropdownId.set(null);
    }
  }

  onSelectAll(): void {
    const updated = this.paymentTypes().map(p => ({ ...p, selected: true }));
    this.paymentTypes.set(updated);
    this.selectAll.set(true);
  }

  onSelectNone(): void {
    const updated = this.paymentTypes().map(p => ({ ...p, selected: false }));
    this.paymentTypes.set(updated);
    this.selectAll.set(false);
  }

  togglePaymentTypeSelection(paymentType: PaymentType): void {
    const updated = this.paymentTypes().map(p =>
      p.id === paymentType.id ? { ...p, selected: !p.selected } : p
    );
    this.paymentTypes.set(updated);
    this.selectAll.set(updated.every(p => p.selected));
  }

  toggleActive(paymentType: PaymentType, value: boolean): void {
    const updated = this.paymentTypes().map(p =>
      p.id === paymentType.id ? { ...p, active: value } : p
    );
    this.paymentTypes.set(updated);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }
}
