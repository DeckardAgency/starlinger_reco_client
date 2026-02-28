import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { ButtonComponent } from '@app/ui-kit/atoms/button/button.component';
import { InputComponent } from '@app/ui-kit/atoms/input/input.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { FormFieldComponent } from '@app/ui-kit/molecules';
import { AuthService } from '@core/auth/auth.service';
import { UserService } from '@core/services/http/user.service';
import { User } from '@core/models';

@Component({
  selector: 'app-customer-admin-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BreadcrumbsComponent,
    ButtonComponent,
    InputComponent,
    IconComponent,
    FormFieldComponent
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);

  saveError = signal<string | null>(null);
  passwordError = signal<string | null>(null);

  user = signal<User | null>(null);
  isEditing = signal(false);
  isSaving = signal(false);
  showPasswordChange = signal(false);

  // Profile form
  profileForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  };

  // Password form
  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  ngOnInit(): void {
    this.loadUser();
  }

  private loadUser(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.user.set(currentUser);
      this.populateForm(currentUser);
    }
    this.cdr.markForCheck();
  }

  private populateForm(user: User): void {
    this.profileForm = {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: ''
    };
  }

  onEditProfile(): void {
    this.isEditing.set(true);
  }

  onCancelEdit(): void {
    const user = this.user();
    if (user) {
      this.populateForm(user);
    }
    this.isEditing.set(false);
  }

  onSaveProfile(): void {
    const currentUser = this.user();
    if (!currentUser) {
      return;
    }

    this.isSaving.set(true);
    this.saveError.set(null);

    const updateData = {
      firstName: this.profileForm.firstName,
      lastName: this.profileForm.lastName
    };

    this.userService.updateUser(String(currentUser.id), updateData).subscribe({
      next: (updatedUser) => {
        // Update local user state
        this.user.set({ ...currentUser, ...updatedUser });
        this.authService.updateCurrentUser(updatedUser);
        this.isSaving.set(false);
        this.isEditing.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to update profile:', error);
        this.saveError.set('Failed to save profile. Please try again.');
        this.isSaving.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  onTogglePasswordChange(): void {
    this.showPasswordChange.update(v => !v);
    if (!this.showPasswordChange()) {
      this.resetPasswordForm();
    }
  }

  onChangePassword(): void {
    const currentUser = this.user();
    if (!currentUser) {
      return;
    }

    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.passwordError.set('Passwords do not match');
      return;
    }

    if (this.passwordForm.newPassword.length < 8) {
      this.passwordError.set('Password must be at least 8 characters');
      return;
    }

    this.passwordError.set(null);

    const passwordData = {
      currentPassword: this.passwordForm.currentPassword,
      newPassword: this.passwordForm.newPassword
    };

    // Cast to any since password change uses different payload than standard user update
    this.userService.updateUser(String(currentUser.id), passwordData as any).subscribe({
      next: () => {
        this.resetPasswordForm();
        this.showPasswordChange.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to change password:', error);
        this.passwordError.set('Failed to change password. Please check your current password.');
        this.cdr.markForCheck();
      }
    });
  }

  private resetPasswordForm(): void {
    this.passwordForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  }

  getRoleDisplay(roles: string[]): string {
    if (!roles || roles.length === 0) return 'User';
    
    if (roles.includes('ROLE_ADMIN')) return 'Admin';
    if (roles.includes('ROLE_CLIENT_ADMIN')) return 'Client Admin';
    if (roles.includes('ROLE_CLIENT')) return 'Client User';
    return 'User';
  }
}
