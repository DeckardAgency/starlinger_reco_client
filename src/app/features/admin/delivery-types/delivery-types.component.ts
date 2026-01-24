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
import { DeliveryType } from '@core/models/delivery-type.model';

@Component({
  selector: 'app-delivery-types',
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
  templateUrl: './delivery-types.component.html',
  styleUrls: ['./delivery-types.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeliveryTypesComponent implements AfterViewInit {
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
  
  selectedCount = computed(() => this.deliveryTypes().filter(d => d.selected).length);
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
  deliveryTypes = signal<DeliveryType[]>([]);

  // Total count
  totalItems = computed(() => this.deliveryTypes().length);

  constructor() {
    this.loadDeliveryTypes();
  }

  private loadDeliveryTypes(): void {
    this.isLoading.set(true);
    import('@core/mocks/mock-data').then(({ mockDeliveryTypes }) => {
      this.deliveryTypes.set(mockDeliveryTypes.map(d => ({ ...d, selected: false })));
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

  onAddDeliveryType(): void {
    this.router.navigate(['/admin/delivery-types/new']);
  }

  toggleDropdown(deliveryTypeId: string, event: Event | void): void {
    if (event) {
      (event as Event).stopPropagation();
    }
    if (this.openDropdownId() === deliveryTypeId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(deliveryTypeId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
    this.isHeaderDropdownOpen.set(false);
  }

  onActionClick(event: { action: TableAction; row: unknown }): void {
    const deliveryType = event.row as DeliveryType;
    switch (event.action.id) {
      case 'edit':
        this.onEdit(deliveryType);
        break;
      case 'delete':
        this.onDelete(deliveryType);
        break;
    }
  }

  onEdit(deliveryType: DeliveryType): void {
    this.router.navigate(['/admin/delivery-types', deliveryType.id]);
    this.closeDropdown();
  }

  onDelete(deliveryType: DeliveryType): void {
    console.log('Delete delivery type:', deliveryType);
    this.closeDropdown();
  }

  onBulkDelete(): void {
    const selected = this.deliveryTypes().filter(d => d.selected);
    console.log('Bulk delete delivery types:', selected);
    const remaining = this.deliveryTypes().filter(d => !d.selected);
    this.deliveryTypes.set(remaining);
    this.selectAll.set(false);
  }

  onHeaderDropdownToggle(isOpen: boolean): void {
    this.isHeaderDropdownOpen.set(isOpen);
    if (isOpen) {
      this.openDropdownId.set(null);
    }
  }

  onSelectAll(): void {
    const updated = this.deliveryTypes().map(d => ({ ...d, selected: true }));
    this.deliveryTypes.set(updated);
    this.selectAll.set(true);
  }

  onSelectNone(): void {
    const updated = this.deliveryTypes().map(d => ({ ...d, selected: false }));
    this.deliveryTypes.set(updated);
    this.selectAll.set(false);
  }

  toggleDeliveryTypeSelection(deliveryType: DeliveryType): void {
    const updated = this.deliveryTypes().map(d => 
      d.id === deliveryType.id ? { ...d, selected: !d.selected } : d
    );
    this.deliveryTypes.set(updated);
    this.selectAll.set(updated.every(d => d.selected));
  }

  toggleActive(deliveryType: DeliveryType, value: boolean): void {
    const updated = this.deliveryTypes().map(d => 
      d.id === deliveryType.id ? { ...d, active: value } : d
    );
    this.deliveryTypes.set(updated);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }
}
