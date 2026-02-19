import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, OnInit, inject } from '@angular/core';
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
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { ButtonComponent } from '@app/ui-kit/atoms/button/button.component';
import { InputComponent } from '@app/ui-kit/atoms/input/input.component';
import { SelectComponent } from '@app/ui-kit/atoms/select/select.component';
import { UserService } from '@core/services/http/user.service';
import { AuthService } from '@core/auth/auth.service';
import { User } from '@core/models';

// Display interface for the data table
interface CustomerAdminUser {
  id: number;
  name: string;
  initials: string;
  avatar?: string;
  dateCreated: string;
  role: 'admin' | 'standard' | 'viewer';
  email: string;
  status: 'active' | 'inactive';
  transactions: number;
}

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
    FormFieldComponent,
    MobileFooterComponent
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent implements AfterViewInit, OnInit {
  private cdr = inject(ChangeDetectorRef);
  private userService = inject(UserService);
  private authService = inject(AuthService);

  @ViewChild('nameTemplate') nameTemplate!: TemplateRef<any>;
  @ViewChild('roleTemplate') roleTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  // Search state
  searchQuery = '';

  // Loading state
  isLoading = signal(true);

  // Sort state
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' | null = null;

  // Dropdown state
  openDropdownId = signal<number | null>(null);

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

  // Users data from API
  allUsers = signal<CustomerAdminUser[]>([]);

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

  ngOnInit(): void {
    this.loadUsers();
  }

  ngAfterViewInit(): void {
    this.initColumns();
    this.cdr.detectChanges();
  }

  private loadUsers(): void {
    this.isLoading.set(true);

    // Get the current user's client code to filter users by client
    const currentUser = this.authService.getCurrentUser();
    const clientCode = currentUser?.client?.code;

    const filters: { page?: number; clientCode?: string } = { page: 1 };
    if (clientCode) {
      filters.clientCode = clientCode;
    }

    this.userService.getUsers(filters).subscribe({
      next: (response) => {
        const users = response.member.map(user => this.mapUserToDisplay(user));
        this.allUsers.set(users);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load users:', error);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  private mapUserToDisplay(user: User): CustomerAdminUser {
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    const initials = this.getInitials(name);
    const role = this.mapRoleToDisplay(user.roles);

    return {
      id: user.id,
      name,
      initials,
      dateCreated: this.formatDate(user.createdAt || ''),
      role,
      email: user.email,
      status: 'active', // Backend doesn't have isActive for users yet
      transactions: user.orders?.length || 0
    };
  }

  private getInitials(name: string): string {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private mapRoleToDisplay(roles: string[]): 'admin' | 'standard' | 'viewer' {
    if (!roles || roles.length === 0) return 'standard';

    // Check for admin roles
    if (roles.includes('ROLE_CLIENT_ADMIN') || roles.includes('ROLE_ADMIN') || roles.includes('ROLE_SUPER_ADMIN')) {
      return 'admin';
    }

    // Check for viewer role
    if (roles.includes('ROLE_VIEWER')) {
      return 'viewer';
    }

    return 'standard';
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

  toggleDropdown(userId: number, event?: Event): void {
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
    const editingUser = this.editingUser();
    const [firstName, ...lastNameParts] = this.formData.fullName.split(' ');
    const lastName = lastNameParts.join(' ');

    const userData = {
      firstName,
      lastName,
      email: this.formData.email,
      roles: [this.mapRoleToApi(this.formData.role)]
    };

    if (editingUser) {
      // Update existing user
      this.userService.updateUser(String(editingUser.id), userData).subscribe({
        next: () => {
          this.loadUsers();
          this.onCloseDrawer();
        },
        error: (error) => {
          console.error('Failed to update user:', error);
        }
      });
    } else {
      // Create new user
      const currentUser = this.authService.getCurrentUser();
      const createData = {
        ...userData,
        // API accepts client as IRI string, cast to bypass strict typing
        client: (currentUser?.client?.['@id'] || currentUser?.client?.id) as any
      };

      this.userService.createUser(createData as any).subscribe({
        next: () => {
          this.loadUsers();
          this.onCloseDrawer();
        },
        error: (error) => {
          console.error('Failed to create user:', error);
        }
      });
    }
  }

  private mapRoleToApi(role: string): string {
    switch (role) {
      case 'admin': return 'ROLE_CLIENT_ADMIN';
      case 'viewer': return 'ROLE_VIEWER';
      default: return 'ROLE_CLIENT';
    }
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
    this.closeDropdown();

    // Update user status to inactive
    this.userService.updateUser(String(user.id), { isActive: false }).subscribe({
      next: () => {
        // Update local state
        this.allUsers.update(users =>
          users.map(u => u.id === user.id ? { ...u, status: 'inactive' as const } : u)
        );
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to deactivate user:', error);
      }
    });
  }

  onDelete(user: CustomerAdminUser): void {
    this.closeDropdown();

    if (!confirm(`Are you sure you want to delete ${user.name}?`)) {
      return;
    }

    this.userService.deleteUser(String(user.id)).subscribe({
      next: () => {
        // Remove user from local state
        this.allUsers.update(users => users.filter(u => u.id !== user.id));
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to delete user:', error);
      }
    });
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'admin': return 'Admin';
      case 'viewer': return 'Viewer';
      default: return 'Standard';
    }
  }

  getRoleVariant(role: string): 'warning' | 'info' | 'secondary' {
    switch (role) {
      case 'admin': return 'warning';
      case 'viewer': return 'secondary';
      default: return 'info';
    }
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
