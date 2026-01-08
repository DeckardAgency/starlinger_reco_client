import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';

interface Discount {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  priority: number;
  dateValidFrom: string;
  dateValidTo: string;
  selected?: boolean;
}

@Component({
    selector: 'app-discounts',
    standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DataTableComponent,
    BadgeComponent
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

  // Mock data
  discounts = signal<Discount[]>([
    { id: '0001', name: 'ET -30%', status: 'active', priority: 0, dateValidFrom: '25/10/2024 00:00:25', dateValidTo: '01/11/2024 00:00:25' },
    { id: '0002', name: 'Black Friday -50%', status: 'active', priority: 3, dateValidFrom: '25/11/2024 00:00:11', dateValidTo: '10/11/2024 00:00:11' },
    { id: '0003', name: 'Spring -25%', status: 'active', priority: 2, dateValidFrom: '01/02/2025 00:00:19', dateValidTo: '25/02/2025 00:00:19' },
    { id: '0004', name: 'Special -50%', status: 'inactive', priority: 0, dateValidFrom: '15/03/2025 00:05:42', dateValidTo: '15/03/2025 00:05:45' }
  ]);

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

  toggleDropdown(discountId: string, event: Event): void {
    event.stopPropagation();
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

  onEdit(discount: Discount): void {
    this.router.navigate(['/admin/discounts', discount.id]);
    this.closeDropdown();
  }

  onClone(discount: Discount): void {
    console.log('Clone discount:', discount);
    this.closeDropdown();
  }

  onDelete(discount: Discount): void {
    console.log('Delete discount:', discount);
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

  toggleHeaderDropdown(event: Event): void {
    event.stopPropagation();
    this.isHeaderDropdownOpen.set(!this.isHeaderDropdownOpen());
    this.openDropdownId.set(null); // Close any row dropdowns
  }

  closeHeaderDropdown(): void {
    this.isHeaderDropdownOpen.set(false);
            }

  onSelectAll(): void {
    const updated = this.discounts().map(d => ({ ...d, selected: true }));
    this.discounts.set(updated);
    this.selectAll.set(true);
    this.closeHeaderDropdown();
  }

  onSelectNone(): void {
    const updated = this.discounts().map(d => ({ ...d, selected: false }));
    this.discounts.set(updated);
    this.selectAll.set(false);
    this.closeHeaderDropdown();
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
