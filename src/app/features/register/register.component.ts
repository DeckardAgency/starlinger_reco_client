import { Component, ChangeDetectionStrategy, signal, inject, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { animate, style, transition, trigger } from '@angular/animations';
import { InputComponent, ButtonComponent, LinkComponent } from '@app/ui-kit';
import { environment } from '@env/environment';

interface InvitationVerifyResponse {
  valid: boolean;
  email?: string;
  firstName?: string;
  lastName?: string;
  error?: string;
}

/**
 * Invitation landing page: /register?token=...
 * Verifies the emailed invitation token, lets the invitee choose a password,
 * completes the invitation (backend creates the account) and sends them to login.
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputComponent,
    ButtonComponent,
    LinkComponent
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class RegisterComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  private token = '';

  // 'verifying' | 'invalid' | 'form' | 'done'
  state = signal<'verifying' | 'invalid' | 'form' | 'done'>('verifying');

  email = signal('');
  fullName = signal('');
  passwordValue = '';
  repeatPasswordValue = '';
  isLoading = signal(false);
  errorMessage = signal('');

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.state.set('invalid');
      return;
    }

    this.http.get<InvitationVerifyResponse>(
      `${environment.apiBaseUrl}/api/user_invitations/verify/${encodeURIComponent(this.token)}`
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.email.set(res.email ?? '');
        this.fullName.set([res.firstName, res.lastName].filter(Boolean).join(' '));
        this.state.set('form');
      },
      error: () => this.state.set('invalid')
    });
  }

  onPasswordChange(value: string): void {
    this.passwordValue = value;
    this.errorMessage.set('');
  }

  onRepeatPasswordChange(value: string): void {
    this.repeatPasswordValue = value;
    this.errorMessage.set('');
  }

  onSubmit(): void {
    if (!this.passwordValue || this.passwordValue.length < 8) {
      this.errorMessage.set('Password must be at least 8 characters.');
      return;
    }
    if (this.passwordValue !== this.repeatPasswordValue) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.isLoading.set(true);
    this.http.post(
      `${environment.apiBaseUrl}/api/user_invitations/complete`,
      { token: this.token, password: this.passwordValue }
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.state.set('done');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.error || 'Something went wrong. Please try again.');
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
