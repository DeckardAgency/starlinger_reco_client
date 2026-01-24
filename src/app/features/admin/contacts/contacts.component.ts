import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject, signal, TemplateRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { Contact } from '@core/models/account.model';
import { mockAdminContacts } from '@core/mocks/mock-data';

// Consolidated components
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { ListHeaderComponent } from '@app/ui-kit/molecules/list-header/list-header.component';
import { TableActionsDropdownComponent, TableAction } from '@app/ui-kit/molecules/table-actions-dropdown/table-actions-dropdown.component';
import { TableFooterComponent } from '@app/ui-kit/molecules/table-footer/table-footer.component';

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DataTableComponent,
    BreadcrumbsComponent,
    ListHeaderComponent,
    TableActionsDropdownComponent,
    TableFooterComponent
  ],
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactsComponent implements AfterViewInit {
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('phoneTemplate') phoneTemplate!: TemplateRef<any>;

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
  contacts: Contact[] = mockAdminContacts as Contact[];
  filteredContacts: Contact[] = [...this.contacts];

  ngAfterViewInit(): void {
    this.initColumns();
    this.cdr.detectChanges();
  }

  private initColumns(): void {
    this.columns = [
      { key: 'id', label: 'Id', sortable: true, width: '88px' },
      { key: 'firstName', label: 'First name', sortable: true },
      { key: 'lastName', label: 'Last name', sortable: true },
      { key: 'account', label: 'Account', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'phone', label: 'Phone', sortable: false, width: '160px', template: this.phoneTemplate },
      { key: 'actions', label: '', sortable: false, width: '64px', template: this.actionsTemplate }
    ];
  }

  onSearchQueryChange(query: string): void {
    this.searchQuery = query;
    this.onSearch();
  }

  onSearch(): void {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredContacts = [...this.contacts];
    } else {
      this.filteredContacts = this.contacts.filter(contact =>
        contact.firstName.toLowerCase().includes(query) ||
        contact.lastName.toLowerCase().includes(query) ||
        contact.account.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query) ||
        contact.id.toString().includes(query)
      );
    }
    this.cdr.markForCheck();
  }

  onSort(event: SortEvent): void {
    this.sortColumn = event.column;
    this.sortDirection = event.direction;

    if (!event.direction) {
      this.filteredContacts = [...this.contacts];
    } else {
      this.filteredContacts.sort((a, b) => {
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
    setTimeout(() => {
      this.isLoading.set(false);
      this.cdr.markForCheck();
    }, 500);
  }

  onExport(): void {
    console.log('Export contacts');
  }

  onAddContact(): void {
    this.router.navigate(['/admin/contacts/new']);
  }

  toggleDropdown(contactId: number): void {
    this.openDropdownId = this.openDropdownId === contactId ? null : contactId;
    this.cdr.markForCheck();
  }

  closeDropdown(): void {
    this.openDropdownId = null;
    this.cdr.markForCheck();
  }

  onActionClick(event: { action: TableAction; row: unknown }): void {
    const contact = event.row as Contact;
    if (event.action.id === 'edit') {
      this.router.navigate(['/admin/contacts', contact.id]);
    } else if (event.action.id === 'delete') {
      console.log('Delete contact:', contact);
    }
    this.closeDropdown();
  }

  formatPhone(phone: string | undefined): string {
    return phone || '–';
  }

  get totalResults(): number {
    return this.filteredContacts.length;
  }

  get showingFrom(): number {
    return this.filteredContacts.length > 0 ? 1 : 0;
  }

  get showingTo(): number {
    return this.filteredContacts.length;
  }
}
