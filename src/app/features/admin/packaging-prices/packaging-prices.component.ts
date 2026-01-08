import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { PackagingPrice } from '@core/models/packaging-price.model';

@Component({
  selector: 'app-packaging-prices',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DataTableComponent
  ],
  templateUrl: './packaging-prices.component.html',
  styleUrls: ['./packaging-prices.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PackagingPricesComponent implements AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('sizeFromTemplate') sizeFromTemplate!: TemplateRef<any>;
  @ViewChild('sizeToTemplate') sizeToTemplate!: TemplateRef<any>;
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
  
  selectedCount = computed(() => this.packagingPrices().filter(pp => pp.selected).length);
  hasSelected = computed(() => this.selectedCount() > 0);

  // Table columns
  columns: TableColumn[] = [];

  // Data
  packagingPrices = signal<PackagingPrice[]>([]);

  // Total count
  totalItems = computed(() => this.packagingPrices().length);

  constructor() {
    this.loadPackagingPrices();
  }

  private loadPackagingPrices(): void {
    this.isLoading.set(true);
    import('@core/mocks/mock-data').then(({ mockPackagingPrices }) => {
      this.packagingPrices.set(mockPackagingPrices.map((pp: PackagingPrice) => ({ ...pp, selected: false })));
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
      { key: 'id', label: 'id', sortable: true, width: '112px' },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'sizeFrom', label: 'Size from', sortable: true, template: this.sizeFromTemplate },
      { key: 'sizeTo', label: 'Size to', sortable: true, template: this.sizeToTemplate },
      { key: 'priceBase', label: 'Price base', sortable: true, template: this.priceTemplate },
      { key: 'actions', label: '', sortable: false, width: '64px', template: this.actionsTemplate }
    ];
  }

  onSearch(): void {
    console.log('Searching:', this.searchQuery);
  }

  onSortChange(event: SortEvent): void {
    this.sortColumn = event.column;
    this.sortDirection = event.direction;
  }

  onAddPackagingPrice(): void {
    this.router.navigate(['/admin/packaging-prices/new']);
  }

  toggleDropdown(packagingPriceId: string, event: Event): void {
    event.stopPropagation();
    if (this.openDropdownId() === packagingPriceId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(packagingPriceId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
    this.isHeaderDropdownOpen.set(false);
  }

  onEdit(packagingPrice: PackagingPrice): void {
    this.router.navigate(['/admin/packaging-prices', packagingPrice.id]);
    this.closeDropdown();
  }

  onDelete(packagingPrice: PackagingPrice): void {
    console.log('Delete packaging price:', packagingPrice);
    this.closeDropdown();
  }

  onBulkDelete(): void {
    const selected = this.packagingPrices().filter(pp => pp.selected);
    console.log('Bulk delete packaging prices:', selected);
    const remaining = this.packagingPrices().filter(pp => !pp.selected);
    this.packagingPrices.set(remaining);
    this.selectAll.set(false);
  }

  toggleHeaderDropdown(event: Event): void {
    event.stopPropagation();
    this.isHeaderDropdownOpen.set(!this.isHeaderDropdownOpen());
    this.openDropdownId.set(null);
  }

  onSelectAll(): void {
    const updated = this.packagingPrices().map(pp => ({ ...pp, selected: true }));
    this.packagingPrices.set(updated);
    this.selectAll.set(true);
    this.isHeaderDropdownOpen.set(false);
  }

  onSelectNone(): void {
    const updated = this.packagingPrices().map(pp => ({ ...pp, selected: false }));
    this.packagingPrices.set(updated);
    this.selectAll.set(false);
    this.isHeaderDropdownOpen.set(false);
  }

  togglePackagingPriceSelection(packagingPrice: PackagingPrice): void {
    const updated = this.packagingPrices().map(pp => 
      pp.id === packagingPrice.id ? { ...pp, selected: !pp.selected } : pp
    );
    this.packagingPrices.set(updated);
    this.selectAll.set(updated.every(pp => pp.selected));
  }

  formatSize(value: number): string {
    return value.toString();
  }

  formatPrice(value: number): string {
    return value.toFixed(2).replace('.', ',') + ' €';
  }
}

