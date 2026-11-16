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
import { PASSWORD_RULES_HINT, apiErrorMessage, validatePassword } from '@utils/password-policy';

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
  readonly passwordRulesHint = PASSWORD_RULES_HINT;
  /** Inline errors of the change-password form, one per field. */
  currentPasswordError = signal('');
  newPasswordError = signal('');
  confirmPasswordError = signal('');
  isChangingPassword = signal(false);

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

  onPasswordInput(): void {
    if (this.currentPasswordError() || this.newPasswordError() || this.confirmPasswordError()) {
      this.clearPasswordErrors();
    }
  }

  onChangePassword(): void {
    const currentUser = this.user();
    if (!currentUser || this.isChangingPassword()) {
      return;
    }

    this.clearPasswordErrors();

    if (!this.passwordForm.currentPassword) {
      this.currentPasswordError.set('Please enter your current password.');
      return;
    }

    // Same rules as the backend (and the reset-password form), explained before submit
    const ruleError = validatePassword(this.passwordForm.newPassword);
    if (ruleError) {
      this.newPasswordError.set(ruleError);
      return;
    }

    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.confirmPasswordError.set('The passwords do not match.');
      return;
    }

    this.isChangingPassword.set(true);

    // Changing your OWN password: the backend requires the current one alongside the new
    // one (`plainPassword` is the User resource's writable password field).
    this.userService.changeOwnPassword(
      String(currentUser.id),
      this.passwordForm.currentPassword,
      this.passwordForm.newPassword
    ).subscribe({
      next: () => {
        this.isChangingPassword.set(false);
        this.resetPasswordForm();
        this.showPasswordChange.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isChangingPassword.set(false);
        this.showPasswordChangeError(error);
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Put the backend's answer next to the field it is about: a rejected current password
   * (403, or a 422 violation on `currentPassword`) or a rejected new password (422).
   */
  private showPasswordChangeError(error: unknown): void {
    const status = (error as { status?: number } | null)?.status;
    const violations = (error as { error?: { violations?: Array<{ propertyPath?: string; message?: string }> } } | null)
      ?.error?.violations;
    const violation = (path: string): string =>
      (Array.isArray(violations) ? violations : [])
        .filter(v => v?.propertyPath === path && v.message)
        .map(v => v.message)
        .join(' ');

    const currentViolation = violation('currentPassword');
    const message = apiErrorMessage(error, '');

    if (currentViolation || status === 403 || (status === 422 && /current password/i.test(message))) {
      this.currentPasswordError.set(
        currentViolation || (/password/i.test(message) ? message : 'The current password is incorrect.')
      );
      return;
    }

    this.newPasswordError.set(
      violation('plainPassword') || message || 'Could not change the password. Please try again.'
    );
  }

  private clearPasswordErrors(): void {
    this.currentPasswordError.set('');
    this.newPasswordError.set('');
    this.confirmPasswordError.set('');
  }

  private resetPasswordForm(): void {
    this.passwordForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    this.clearPasswordErrors();
  }

  getRoleDisplay(roles: string[]): string {
    if (!roles || roles.length === 0) return 'User';
    
    if (roles.includes('ROLE_ADMIN')) return 'Admin';
    if (roles.includes('ROLE_CLIENT_ADMIN')) return 'Client Admin';
    if (roles.includes('ROLE_CLIENT')) return 'Client User';
    return 'User';
  }
}
