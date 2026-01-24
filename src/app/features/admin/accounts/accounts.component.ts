import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject, signal, TemplateRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';
import { Account } from '@core/models/account.model';
import { mockAccounts } from '@core/mocks/mock-data';

// Consolidated components
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { ListHeaderComponent } from '@app/ui-kit/molecules/list-header/list-header.component';
import { TableActionsDropdownComponent, TableAction } from '@app/ui-kit/molecules/table-actions-dropdown/table-actions-dropdown.component';
import { TableFooterComponent } from '@app/ui-kit/molecules/table-footer/table-footer.component';

@Component({
  selector: 'app-accounts',
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
    TableFooterComponent
  ],
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountsComponent implements AfterViewInit {
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('purchaseLimitTemplate') purchaseLimitTemplate!: TemplateRef<any>;
  @ViewChild('amountSpentTemplate') amountSpentTemplate!: TemplateRef<any>;

  searchQuery = '';
  isLoading = signal(false);
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' | null = null;
  openDropdownId: number | null = null;

  // Table columns - will be set after view init to use templates
  columns: TableColumn[] = [];

  // Table actions
  tableActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  // Data from centralized mock data
  accounts: Account[] = mockAccounts as Account[];
  filteredAccounts: Account[] = [...this.accounts];

  ngAfterViewInit(): void {
    this.initColumns();
    this.cdr.detectChanges();
  }

  private initColumns(): void {
    this.columns = [
      { key: 'id', label: 'Id', sortable: true, width: '80px' },
      { key: 'code', label: 'Code', sortable: true, width: '80px' },
      { key: 'oib', label: 'OIB', sortable: true, width: '120px' },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'email', label: 'Email', sortable: true, width: '180px' },
      { key: 'status', label: 'Status', sortable: true, width: '100px', template: this.statusTemplate },
      { key: 'purchaseLimit', label: 'Purchase limit', sortable: true, width: '130px', template: this.purchaseLimitTemplate },
      { key: 'amountSpent', label: 'Amount spent', sortable: true, width: '130px', template: this.amountSpentTemplate },
      { key: 'actions', label: '', sortable: false, width: '56px', template: this.actionsTemplate }
    ];
  }

  onSearchQueryChange(query: string): void {
    this.searchQuery = query;
    this.onSearch();
  }

  onSearch(): void {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredAccounts = [...this.accounts];
    } else {
      this.filteredAccounts = this.accounts.filter(account =>
        account.name.toLowerCase().includes(query) ||
        account.email.toLowerCase().includes(query) ||
        account.oib.toLowerCase().includes(query) ||
        account.code?.toLowerCase().includes(query) ||
        account.id.toString().includes(query)
      );
    }
    this.cdr.markForCheck();
  }

  onSort(event: SortEvent): void {
    this.sortColumn = event.column;
    this.sortDirection = event.direction;

    if (!event.direction) {
      this.filteredAccounts = [...this.accounts];
    } else {
      this.filteredAccounts.sort((a, b) => {
        const aValue = (a as any)[event.column];
        const bValue = (b as any)[event.column];

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        let comparison = 0;
        if (typeof aValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else {
          comparison = aValue - bValue;
        }

        return event.direction === 'asc' ? comparison : -comparison;
      });
    }
    this.cdr.markForCheck();
  }

  onRefresh(): void {
    this.isLoading.set(true);
    // Simulate API call
    setTimeout(() => {
      this.isLoading.set(false);
      this.cdr.markForCheck();
    }, 500);
  }

  onExport(): void {
    console.log('Export accounts');
  }

  onAddAccount(): void {
    this.router.navigate(['/admin/accounts/new']);
  }

  toggleDropdown(accountId: number): void {
    this.openDropdownId = this.openDropdownId === accountId ? null : accountId;
    this.cdr.markForCheck();
  }

  closeDropdown(): void {
    this.openDropdownId = null;
    this.cdr.markForCheck();
  }

  onActionClick(event: { action: TableAction; row: unknown }): void {
    const account = event.row as Account;
    if (event.action.id === 'edit') {
      this.router.navigate(['/admin/accounts', account.id]);
    } else if (event.action.id === 'delete') {
      console.log('Delete account:', account);
    }
    this.closeDropdown();
  }

  formatCurrency(value: number | undefined): string {
    if (value === undefined || value === null) return '';
    return new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }

  get totalResults(): number {
    return this.filteredAccounts.length;
  }

  get showingFrom(): number {
    return this.filteredAccounts.length > 0 ? 1 : 0;
  }

  get showingTo(): number {
    return this.filteredAccounts.length;
  }
}
