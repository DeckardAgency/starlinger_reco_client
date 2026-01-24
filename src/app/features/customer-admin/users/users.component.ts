import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { DrawerComponent } from '@app/ui-kit/organisms/drawer/drawer.component';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';
import { AvatarComponent } from '@app/ui-kit/atoms/avatar/avatar.component';
import { ToggleComponent } from '@app/ui-kit/atoms/toggle/toggle.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { 
  ListHeaderComponent,
  TableFooterComponent,
  TableActionsDropdownComponent,
  TableAction,
  FormFieldComponent
} from '@app/ui-kit/molecules';
import { ButtonComponent } from '@app/ui-kit/atoms/button/button.component';
import { InputComponent } from '@app/ui-kit/atoms/input/input.component';
import { SelectComponent } from '@app/ui-kit/atoms/select/select.component';
import { mockCustomerAdminUsers, CustomerAdminUser } from '@core/mocks/mock-data';

@Component({
  selector: 'app-customer-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DataTableComponent,
    DrawerComponent,
    BreadcrumbsComponent,
    BadgeComponent,
    AvatarComponent,
    ToggleComponent,
    IconComponent,
    ListHeaderComponent,
    TableFooterComponent,
    TableActionsDropdownComponent,
    ButtonComponent,
    InputComponent,
    SelectComponent,
    FormFieldComponent
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent implements AfterViewInit {
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('nameTemplate') nameTemplate!: TemplateRef<any>;
  @ViewChild('roleTemplate') roleTemplate!: TemplateRef<any>;
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

  // Drawer state
  showAddUserDrawer = signal(false);
  showEditUserDrawer = signal(false);
  editingUser = signal<CustomerAdminUser | null>(null);

  // Form data
  formData = {
    isActive: true,
    fullName: '',
    email: '',
    role: ''
  };

  // Table columns
  columns: TableColumn[] = [];

  // Table actions for dropdown
  tableActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'deactivate', label: 'Deactivate', icon: 'x-circle' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  // Role options for select
  roleOptions = [
    { value: 'viewer', label: 'Viewer' },
    { value: 'standard', label: 'Regular' },
    { value: 'admin', label: 'Admin' }
  ];

  // Users data
  allUsers = signal<CustomerAdminUser[]>([...mockCustomerAdminUsers]);

  // Filtered users based on search
  users = computed(() => {
    const query = this.searchQuery.toLowerCase();
    const all = this.allUsers();

    if (!query) {
      return all;
    }

    return all.filter(u => 
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    );
  });

  // Total count
  totalCount = computed(() => this.allUsers().length);

  // Active users count
  activeUsersCount = computed(() => this.allUsers().filter(u => u.status === 'active').length);

  ngAfterViewInit(): void {
    this.initColumns();
    this.cdr.detectChanges();
  }

  private initColumns(): void {
    this.columns = [
      { key: 'name', label: 'Name', sortable: false, template: this.nameTemplate },
      { key: 'dateCreated', label: 'Date Created', sortable: true, width: '150px' },
      { key: 'role', label: 'Role', sortable: false, width: '130px', template: this.roleTemplate },
      { key: 'email', label: 'E-mail address', sortable: false },
      { key: 'status', label: 'Status', sortable: false, width: '110px', template: this.statusTemplate },
      { key: 'transactions', label: 'Transactions', sortable: false, width: '120px' },
      { key: 'actions', label: '', sortable: false, width: '64px', template: this.actionsTemplate }
    ];
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.cdr.markForCheck();
  }

  onSortChange(event: SortEvent): void {
    this.sortColumn = event.column;
    this.sortDirection = event.direction;
  }

  toggleDropdown(userId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.openDropdownId() === userId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(userId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
  }

  onAddUser(): void {
    this.resetForm();
    this.showAddUserDrawer.set(true);
  }

  onCloseDrawer(): void {
    this.showAddUserDrawer.set(false);
    this.showEditUserDrawer.set(false);
    this.editingUser.set(null);
    this.resetForm();
  }

  onActionClick(event: { action: TableAction; row: unknown }): void {
    const user = event.row as CustomerAdminUser;
    switch (event.action.id) {
      case 'edit':
        this.onEdit(user);
        break;
      case 'deactivate':
        this.onDeactivate(user);
        break;
      case 'delete':
        this.onDelete(user);
        break;
    }
  }

  onEdit(user: CustomerAdminUser): void {
    this.editingUser.set(user);
    this.formData = {
      isActive: user.status === 'active',
      fullName: user.name,
      email: user.email,
      role: user.role
    };
    this.showEditUserDrawer.set(true);
    this.closeDropdown();
  }

  onSaveUser(): void {
    console.log('Saving user:', this.formData);
    this.onCloseDrawer();
  }

  private resetForm(): void {
    this.formData = {
      isActive: true,
      fullName: '',
      email: '',
      role: ''
    };
  }

  onDeactivate(user: CustomerAdminUser): void {
    console.log('Deactivate user:', user);
    this.closeDropdown();
  }

  onDelete(user: CustomerAdminUser): void {
    console.log('Delete user:', user);
    this.closeDropdown();
  }

  getRoleLabel(role: string): string {
    return role === 'admin' ? 'Admin' : 'Standard';
  }

  getRoleVariant(role: string): 'warning' | 'info' {
    return role === 'admin' ? 'warning' : 'info';
  }

  getStatusLabel(status: string): string {
    return status === 'active' ? 'Active' : 'Inactive';
  }

  getStatusVariant(status: string): 'success' | 'danger' {
    return status === 'active' ? 'success' : 'danger';
  }

  onToggleActive(value: boolean): void {
    this.formData.isActive = value;
  }
}
