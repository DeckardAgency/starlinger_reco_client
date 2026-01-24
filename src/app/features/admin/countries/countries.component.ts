import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { 
  ListHeaderComponent,
  TableFooterComponent,
  TableActionsDropdownComponent,
  TableCheckboxSelectionComponent,
  TableAction
} from '@app/ui-kit/molecules';
import { Country } from '@core/models/country.model';

@Component({
  selector: 'app-countries',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DataTableComponent,
    BadgeComponent,
    BreadcrumbsComponent,
    ListHeaderComponent,
    TableFooterComponent,
    TableActionsDropdownComponent,
    TableCheckboxSelectionComponent
  ],
  templateUrl: './countries.component.html',
  styleUrls: ['./countries.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CountriesComponent implements AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('europeanUnionTemplate') europeanUnionTemplate!: TemplateRef<any>;
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
  
  // Computed: selected countries count
  selectedCount = computed(() => this.countries().filter(c => c.selected).length);
  
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
  countries = signal<Country[]>([]);

  // Total count
  totalItems = computed(() => this.countries().length);

  constructor() {
    this.loadCountries();
  }

  private loadCountries(): void {
    this.isLoading.set(true);
    // In real app this would be an HTTP call - mock interceptor handles it
    // For now, import mock data directly
    import('@core/mocks/mock-data').then(({ mockCountries }) => {
      this.countries.set(mockCountries.map(c => ({ ...c, selected: false })));
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
      { key: 'code', label: 'Code', sortable: false, width: '192px' },
      { key: 'europeanUnion', label: 'European union', sortable: false, width: '192px', template: this.europeanUnionTemplate },
      { key: 'dhlZone', label: 'DHL zone', sortable: false, width: '192px' },
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

  onAddCountry(): void {
    this.router.navigate(['/admin/countries/new']);
  }

  toggleDropdown(countryId: string, event: Event | void): void {
    if (event) {
      (event as Event).stopPropagation();
    }
    if (this.openDropdownId() === countryId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(countryId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
    this.isHeaderDropdownOpen.set(false);
  }

  onActionClick(event: { action: TableAction; row: unknown }): void {
    const country = event.row as Country;
    switch (event.action.id) {
      case 'edit':
        this.onEdit(country);
        break;
      case 'delete':
        this.onDelete(country);
        break;
    }
  }

  onEdit(country: Country): void {
    this.router.navigate(['/admin/countries', country.id]);
    this.closeDropdown();
  }

  onDelete(country: Country): void {
    console.log('Delete country:', country);
    this.closeDropdown();
  }

  onBulkDelete(): void {
    const selected = this.countries().filter(c => c.selected);
    console.log('Bulk delete countries:', selected);
    const remaining = this.countries().filter(c => !c.selected);
    this.countries.set(remaining);
    this.selectAll.set(false);
  }

  onHeaderDropdownToggle(isOpen: boolean): void {
    this.isHeaderDropdownOpen.set(isOpen);
    if (isOpen) {
      this.openDropdownId.set(null);
    }
  }

  onSelectAll(): void {
    const updated = this.countries().map(c => ({ ...c, selected: true }));
    this.countries.set(updated);
    this.selectAll.set(true);
  }

  onSelectNone(): void {
    const updated = this.countries().map(c => ({ ...c, selected: false }));
    this.countries.set(updated);
    this.selectAll.set(false);
  }

  toggleCountrySelection(country: Country): void {
    const updated = this.countries().map(c => 
      c.id === country.id ? { ...c, selected: !c.selected } : c
    );
    this.countries.set(updated);
    this.selectAll.set(updated.every(c => c.selected));
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }
}
