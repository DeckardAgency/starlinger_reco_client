import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject, signal, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { BreadcrumbsComponent, BreadcrumbItem } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';
import { Account } from '@core/models/account.model';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbsComponent,
    DataTableComponent,
    BadgeComponent
  ],
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountsComponent {
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('purchaseLimitTemplate') purchaseLimitTemplate!: TemplateRef<any>;
  @ViewChild('amountSpentTemplate') amountSpentTemplate!: TemplateRef<any>;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Accounts' }
  ];

  searchQuery = '';
  isLoading = signal(false);
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' | null = null;

  // Dropdown state
  openDropdownId: number | null = null;

  // Table columns - will be set after view init to use templates
  columns: TableColumn[] = [];

  // Mock accounts data
  accounts: Account[] = [
    { id: 317330, code: '408170', oib: 'PL7151954741', name: 'Akpol Recykling Sp.z.o.o.', email: 'anes@company.com', status: 'active', purchaseLimit: undefined, amountSpent: undefined },
    { id: 317331, code: '', oib: '1262330853', name: 'Alaxe Italia Recycling S.p.A.', email: 'emanuel@company.com', status: 'active', purchaseLimit: undefined, amountSpent: undefined },
    { id: 317332, code: '542319', oib: 'ESAA3931358', name: 'Kugo Repara SL', email: 'eroghan@company.com', status: 'inactive', purchaseLimit: 15000, amountSpent: 0 },
    { id: 317333, code: '693192', oib: 'ESAA4941362', name: 'OMT Recycling Project S.L.', email: 'linda@company.com', status: 'inactive', purchaseLimit: 25000, amountSpent: 1500 },
    { id: 317334, code: '743123', oib: 'ATU72944977', name: 'PRT Rodomska', email: 'allen@company.com', status: 'active', purchaseLimit: 0, amountSpent: 0 },
    { id: 317335, code: '852374', oib: 'BE043913824', name: 'Rymoplast n.v.', email: 'dupton@company.com', status: 'inactive', purchaseLimit: 15000, amountSpent: 200 },
    { id: 317336, code: '912845', oib: 'PL7151954742', name: 'EcoCycle Solutions Inc.', email: 'marissa@company.com', status: 'active', purchaseLimit: undefined, amountSpent: undefined },
    { id: 317337, code: '103672', oib: '1262330854', name: 'GreenTech Waste Management Co.', email: 'jason@company.com', status: 'active', purchaseLimit: undefined, amountSpent: undefined },
    { id: 317338, code: '114589', oib: 'ESAA3931359', name: 'Reclaim Innovations Ltd.', email: 'carmen@company.com', status: 'inactive', purchaseLimit: 15000, amountSpent: 0 },
    { id: 317339, code: '125678', oib: 'ESAA4941363', name: 'Sustainable Materials Group LLC', email: 'thomas@company.com', status: 'inactive', purchaseLimit: 25000, amountSpent: 1500 },
    { id: 317340, code: '136789', oib: 'ATU72944978', name: 'TerraRenew Recycling Partners', email: 'natalie@company.com', status: 'active', purchaseLimit: 0, amountSpent: 0 },
    { id: 317341, code: '147890', oib: 'BE043913825', name: 'WasteWise Environmental Services', email: 'paul@company.com', status: 'inactive', purchaseLimit: undefined, amountSpent: 200 }
  ];

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

  toggleDropdown(accountId: number, event: Event): void {
    event.stopPropagation();
    this.openDropdownId = this.openDropdownId === accountId ? null : accountId;
    this.cdr.markForCheck();
  }

  closeDropdown(): void {
    this.openDropdownId = null;
    this.cdr.markForCheck();
  }

  onEdit(account: Account): void {
    this.closeDropdown();
    this.router.navigate(['/admin/accounts', account.id]);
  }

  onDelete(account: Account): void {
    console.log('Delete account:', account);
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
