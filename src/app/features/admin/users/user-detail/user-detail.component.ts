import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { DetailHeaderComponent } from '@app/ui-kit/molecules/detail-header/detail-header.component';
import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { AdminUser, AdminUserRoleType, ADMIN_USER_ROLE_OPTIONS, AdminUserRoleOption } from '@core/models/admin-user.model';

const EMPTY_USER: AdminUser = {
  id: '',
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  role: null
};

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbsComponent,
    DetailHeaderComponent,
    FormFieldComponent,
    IconComponent,
    MobileFooterComponent
  ],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserDetailComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  isEditMode = signal(false);
  userId = signal<string | null>(null);
  user = signal<AdminUser>(EMPTY_USER);
  isLoading = signal(false);

  // Password fields
  password = signal('');
  repeatPassword = signal('');
  showPassword = signal(false);
  showRepeatPassword = signal(false);

  // Role options
  roleOptions: AdminUserRoleOption[] = ADMIN_USER_ROLE_OPTIONS;

  constructor() {
    this.route.params.pipe(takeUntilDestroyed()).subscribe(params => {
      const id = params['id'];
      if (id && id !== 'new') {
        this.userId.set(id);
        this.isEditMode.set(true);
        this.loadUser(id);
      } else {
        this.isEditMode.set(false);
        this.user.set({ ...EMPTY_USER });
      }
    });
  }

  ngOnInit(): void {}

  private loadUser(id: string): void {
    this.isLoading.set(true);
    import('@core/mocks/mock-data').then(({ mockAdminUsers }) => {
      const found = mockAdminUsers.find((u: any) => u.id === id);
      if (found) {
        this.user.set({ ...found } as AdminUser);
      }
      this.isLoading.set(false);
      this.cdr.markForCheck();
    });
  }

  onFirstNameChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.user.update(u => ({ ...u, firstName: input.value }));
  }

  onLastNameChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.user.update(u => ({ ...u, lastName: input.value }));
  }

  onUsernameChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.user.update(u => ({ ...u, username: input.value }));
  }

  onEmailChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.user.update(u => ({ ...u, email: input.value }));
  }

  onPasswordChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.password.set(input.value);
  }

  onRepeatPasswordChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.repeatPassword.set(input.value);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  toggleRepeatPasswordVisibility(): void {
    this.showRepeatPassword.update(v => !v);
  }

  isRoleSelected(roleId: AdminUserRoleType): boolean {
    return this.user().role === roleId;
  }

  selectRole(roleId: AdminUserRoleType): void {
    this.user.update(u => ({ ...u, role: roleId }));
  }

  onSave(): void {
    console.log('Saving user:', this.user());
    console.log('Password:', this.password());
    this.router.navigate(['/admin/users']);
  }

  onDiscard(): void {
    this.router.navigate(['/admin/users']);
  }

  goBack(): void {
    this.router.navigate(['/admin/users']);
  }
}
