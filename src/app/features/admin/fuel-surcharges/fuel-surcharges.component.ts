import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { FuelSurcharge } from '@core/models/fuel-surcharge.model';

@Component({
  selector: 'app-fuel-surcharges',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DataTableComponent
  ],
  templateUrl: './fuel-surcharges.component.html',
  styleUrls: ['./fuel-surcharges.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FuelSurchargesComponent implements AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('fuelSurchargeTemplate') fuelSurchargeTemplate!: TemplateRef<any>;

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
  
  selectedCount = computed(() => this.fuelSurcharges().filter(fs => fs.selected).length);
  hasSelected = computed(() => this.selectedCount() > 0);

  // Table columns
  columns: TableColumn[] = [];

  // Data
  fuelSurcharges = signal<FuelSurcharge[]>([]);

  // Total count
  totalItems = computed(() => this.fuelSurcharges().length);

  constructor() {
    this.loadFuelSurcharges();
  }

  private loadFuelSurcharges(): void {
    this.isLoading.set(true);
    import('@core/mocks/mock-data').then(({ mockFuelSurcharges }) => {
      this.fuelSurcharges.set(mockFuelSurcharges.map((fs: FuelSurcharge) => ({ ...fs, selected: false })));
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
      { key: 'date', label: 'Date', sortable: true },
      { key: 'fuelSurcharge', label: 'Fuel surcharge', sortable: true, template: this.fuelSurchargeTemplate },
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

  onAddFuelSurcharge(): void {
    this.router.navigate(['/admin/fuel-surcharges/new']);
  }

  toggleDropdown(fuelSurchargeId: string, event: Event): void {
    event.stopPropagation();
    if (this.openDropdownId() === fuelSurchargeId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(fuelSurchargeId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
    this.isHeaderDropdownOpen.set(false);
  }

  onEdit(fuelSurcharge: FuelSurcharge): void {
    this.router.navigate(['/admin/fuel-surcharges', fuelSurcharge.id]);
    this.closeDropdown();
  }

  onDelete(fuelSurcharge: FuelSurcharge): void {
    console.log('Delete fuel surcharge:', fuelSurcharge);
    this.closeDropdown();
  }

  onBulkDelete(): void {
    const selected = this.fuelSurcharges().filter(fs => fs.selected);
    console.log('Bulk delete fuel surcharges:', selected);
    const remaining = this.fuelSurcharges().filter(fs => !fs.selected);
    this.fuelSurcharges.set(remaining);
    this.selectAll.set(false);
  }

  toggleHeaderDropdown(event: Event): void {
    event.stopPropagation();
    this.isHeaderDropdownOpen.set(!this.isHeaderDropdownOpen());
    this.openDropdownId.set(null);
  }

  onSelectAll(): void {
    const updated = this.fuelSurcharges().map(fs => ({ ...fs, selected: true }));
    this.fuelSurcharges.set(updated);
    this.selectAll.set(true);
    this.isHeaderDropdownOpen.set(false);
  }

  onSelectNone(): void {
    const updated = this.fuelSurcharges().map(fs => ({ ...fs, selected: false }));
    this.fuelSurcharges.set(updated);
    this.selectAll.set(false);
    this.isHeaderDropdownOpen.set(false);
  }

  toggleFuelSurchargeSelection(fuelSurcharge: FuelSurcharge): void {
    const updated = this.fuelSurcharges().map(fs => 
      fs.id === fuelSurcharge.id ? { ...fs, selected: !fs.selected } : fs
    );
    this.fuelSurcharges.set(updated);
    this.selectAll.set(updated.every(fs => fs.selected));
  }

  formatFuelSurcharge(value: number): string {
    return value.toFixed(4).replace('.', ',');
  }

  onExport(): void {
    console.log('Export fuel surcharges');
  }
}
