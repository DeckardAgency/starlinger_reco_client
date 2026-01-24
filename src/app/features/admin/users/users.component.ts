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
import { AdminUser } from '@core/models/admin-user.model';

@Component({
  selector: 'app-admin-users',
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
    TableCheckboxSelectionComponent
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent implements AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate!: TemplateRef<any>;
  @ViewChild('roleTemplate') roleTemplate!: TemplateRef<any>;

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
  
  selectedCount = computed(() => this.users().filter(u => u.selected).length);
  hasSelected = computed(() => this.selectedCount() > 0);

  // Table columns
  columns: TableColumn[] = [];

  // Table actions for dropdown
  tableActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  // Data
  users = signal<AdminUser[]>([]);

  // Total count
  totalItems = computed(() => this.users().length);

  constructor() {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.isLoading.set(true);
    import('@core/mocks/mock-data').then(({ mockAdminUsers }) => {
      this.users.set(mockAdminUsers.map((u: any) => ({ ...u, selected: false } as AdminUser)));
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
      { key: 'name', label: 'Name', sortable: true, template: this.nameTemplate },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'role', label: 'Role', sortable: true, template: this.roleTemplate },
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

  onAddUser(): void {
    this.router.navigate(['/admin/users/new']);
  }

  toggleDropdown(userId: string, event: Event | void): void {
    if (event) {
      (event as Event).stopPropagation();
    }
    if (this.openDropdownId() === userId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(userId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
    this.isHeaderDropdownOpen.set(false);
  }

  onActionClick(event: { action: TableAction; row: unknown }): void {
    const user = event.row as AdminUser;
    switch (event.action.id) {
      case 'edit':
        this.onEdit(user);
        break;
      case 'delete':
        this.onDelete(user);
        break;
    }
  }

  onEdit(user: AdminUser): void {
    this.router.navigate(['/admin/users', user.id]);
    this.closeDropdown();
  }

  onDelete(user: AdminUser): void {
    console.log('Delete user:', user);
    this.closeDropdown();
  }

  onBulkDelete(): void {
    const selected = this.users().filter(u => u.selected);
    console.log('Bulk delete users:', selected);
    const remaining = this.users().filter(u => !u.selected);
    this.users.set(remaining);
    this.selectAll.set(false);
  }

  onHeaderDropdownToggle(isOpen: boolean): void {
    this.isHeaderDropdownOpen.set(isOpen);
    if (isOpen) {
      this.openDropdownId.set(null);
    }
  }

  onSelectAll(): void {
    const updated = this.users().map(u => ({ ...u, selected: true }));
    this.users.set(updated);
    this.selectAll.set(true);
  }

  onSelectNone(): void {
    const updated = this.users().map(u => ({ ...u, selected: false }));
    this.users.set(updated);
    this.selectAll.set(false);
  }

  toggleUserSelection(user: AdminUser): void {
    const updated = this.users().map(u => 
      u.id === user.id ? { ...u, selected: !u.selected } : u
    );
    this.users.set(updated);
    this.selectAll.set(updated.every(u => u.selected));
  }

  getFullName(user: AdminUser): string {
    return `${user.firstName} ${user.lastName}`;
  }

  formatRole(role: string | null): string {
    if (!role) return '-';
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  onExport(): void {
    console.log('Export users');
  }
}
