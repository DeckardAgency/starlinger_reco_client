import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject, signal, TemplateRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { Contact } from '@core/models/account.model';

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DataTableComponent
  ],
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactsComponent implements AfterViewInit {
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  searchQuery = '';
  isLoading = signal(false);
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' | null = null;

  // Dropdown state
  openDropdownId: number | null = null;

  // Table columns - will be set after view init to use templates
  columns: TableColumn[] = [];

  // Mock contacts data matching Figma
  contacts: Contact[] = [
    { id: 147144, firstName: 'Alexander', lastName: 'Pas', account: 'Alexander Pas', email: 'grafit.pas@grafit.net', phone: undefined },
    { id: 147145, firstName: 'Anja', lastName: 'Makas', account: 'Kuga Repora SL', email: 'emanuel@company.com', phone: undefined },
    { id: 147146, firstName: 'Paola', lastName: 'Alvarez', account: 'PET Recycling team Gmbh', email: 'eroghan@company.com', phone: '+34942835040' },
    { id: 147147, firstName: 'Christian', lastName: 'Jovanovic', account: 'Unistrap Gmbh', email: 'linda@company.com', phone: '+4366488903488' },
    { id: 147148, firstName: 'Christopher', lastName: 'Cenga', account: 'Rymoplast n.v.', email: 'allen@company.com', phone: '+4366460595847' },
    { id: 147149, firstName: 'David', lastName: 'Aerts', account: 'Unistrap Gmbh', email: 'dupton@company.com', phone: '098123456' },
    { id: 147160, firstName: 'Davor', lastName: 'Kemper', account: 'PET Recycling team', email: 'marissa@company.com', phone: undefined },
    { id: 147166, firstName: 'Erika', lastName: 'Gutierrez', account: 'Rymoplast n.v.', email: 'jason@company.com', phone: undefined },
    { id: 147142, firstName: 'Francesco', lastName: 'Lissak', account: 'Kuga Repora SL', email: 'carmen@company.com', phone: '0048533734241' },
    { id: 147131, firstName: 'Irfan', lastName: 'Nussbaumer', account: 'Kuga Repora SL', email: 'thomas@company.com', phone: '+32470595840' },
    { id: 147155, firstName: 'Lander', lastName: 'Dekkers', account: 'Unistrap Gmbh', email: 'natalie@company.com', phone: undefined },
    { id: 147189, firstName: 'Nancy', lastName: 'Roth', account: 'PET Recycling team Gmbh', email: 'paul@company.com', phone: undefined }
  ];

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
      { key: 'phone', label: 'Phone', sortable: false, width: '160px' },
      { key: 'actions', label: '', sortable: false, width: '64px', template: this.actionsTemplate }
    ];
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

  toggleDropdown(contactId: number, event: Event): void {
    event.stopPropagation();
    this.openDropdownId = this.openDropdownId === contactId ? null : contactId;
    this.cdr.markForCheck();
  }

  closeDropdown(): void {
    this.openDropdownId = null;
    this.cdr.markForCheck();
  }

  onEdit(contact: Contact): void {
    this.closeDropdown();
    this.router.navigate(['/admin/contacts', contact.id]);
  }

  onDelete(contact: Contact): void {
    console.log('Delete contact:', contact);
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
