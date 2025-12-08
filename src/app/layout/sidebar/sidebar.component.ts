import { Component, signal, OnInit, ElementRef, HostListener, inject, DestroyRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SidebarService } from '@services/sidebar.service';
import { AuthService } from '@core/auth/auth.service';
import { User } from '@core/models';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { LoginModalComponent } from '@shared/components/modals/login-modal/login-modal.component';
import { LoginModalService } from '@services/login-modal.service';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-sidebar',
    imports: [CommonModule, RouterModule, LoginModalComponent],
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger('fadeInOut', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('200ms ease-in', style({ opacity: 1 }))
            ]),
            transition(':leave', [
                animate('200ms ease-out', style({ opacity: 0 }))
            ])
        ]),
        trigger('expandCollapse', [
            state('void', style({
                height: '0',
                overflow: 'hidden',
                opacity: 0,
                margin: '0'
            })),
            state('*', style({
                height: '*',
                opacity: 1
            })),
            transition('void <=> *', [
                animate('300ms ease-in-out')
            ])
        ])
    ]
})
export class SidebarComponent implements OnInit {
  isUserDropdownOpen = signal<boolean>(false);
  isLoginModalOpen = signal<boolean>(false);
  currentUser: User | null = null;
  userFullName: string = '';
  userRole: string = '';
  userInitials: string = '';
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  constructor(
    private sidebarService: SidebarService,
    public authService: AuthService,
    private router: Router,
    private elementRef: ElementRef,
    public loginModalService: LoginModalService
  ) {}

  ngOnInit(): void {
    // Subscribe to user changes
    this.authService.currentUser$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(user => {
      this.currentUser = user;
      this.updateUserDisplay();
      this.cdr.markForCheck();
    });

    // Initialize with current user
    this.currentUser = this.authService.getCurrentUser();
    this.updateUserDisplay();

    // Subscribe to login modal state
    this.loginModalService.isOpen$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(isOpen => {
      this.isLoginModalOpen.set(isOpen);
    });
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    // Check if the click was outside the user dropdown area
    const userElement = this.elementRef.nativeElement.querySelector('.sidebar__user');
    if (
      this.isUserDropdownOpen() &&
      userElement &&
      !userElement.contains(event.target)
    ) {
      this.isUserDropdownOpen.set(false);
    }
  }

  toggleUserDropdown(event: Event) {
    // Stop event propagation to prevent the document click handler from firing immediately
    event.stopPropagation();
    this.isUserDropdownOpen.update(value => !value);
  }

  openLoginModal() {
    // Close the user dropdown when opening the login modal
    this.isUserDropdownOpen.set(false);
    this.loginModalService.open();
  }

  onLoginSuccess() {
    // Refresh the user display after login
    this.currentUser = this.authService.getCurrentUser();
    this.updateUserDisplay();
  }

  updateUserDisplay(): void {
    if (this.currentUser) {
      // Set the user full name
      if (this.currentUser.firstName && this.currentUser.lastName) {
        this.userFullName = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
        // Generate initials from name (first letter of first and last name)
        this.userInitials = `${this.currentUser.firstName[0]}${this.currentUser.lastName[0]}`.toUpperCase();
      } else if (this.currentUser.firstName) {
        this.userFullName = this.currentUser.firstName;
        this.userInitials = this.currentUser.firstName[0].toUpperCase();
      } else {
        this.userFullName = this.currentUser.email;
        this.userInitials = this.currentUser.email[0].toUpperCase();
      }

      // Set user role (assuming roles is an array of strings)
      if (this.currentUser.roles && this.currentUser.roles.length > 0) {
        const role = this.currentUser.roles[1];
        // Convert ROLE_USER to User, ROLE_ADMIN to Administrator, etc.
        this.userRole = role.replace('ROLE_', '').charAt(0).toUpperCase() +
          role.replace('ROLE_', '').slice(1).toLowerCase();
      } else {
        this.userRole = 'User';
      }
    }
  }

  get isCollapsed() {
    return this.sidebarService.isCollapsed;
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Check if the current user has a specific role
   * @param role The role to check for (without the ROLE_ prefix)
   * @returns True if the user has the role
   */
  hasRole(role: string): boolean {
    if (!this.currentUser || !this.currentUser.roles) {
      return false;
    }

    const fullRole = `ROLE_${role.toUpperCase()}`;
    return this.currentUser.roles.includes(fullRole);
  }

  /**
   * Check if a menu item should be visible for the current user
   * @param requiredRole Optional role required to view the item
   * @returns True if the item should be visible
   */
  isMenuItemVisible(requiredRole?: string): boolean {
    // If no role is required, show to all authenticated users
    if (!requiredRole) {
      return true;
    }

    // If a role is required, check if user has it
    return this.hasRole(requiredRole);
  }
}
