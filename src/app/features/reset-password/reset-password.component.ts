import { Component, ChangeDetectionStrategy, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { animate, style, transition, trigger } from '@angular/animations';
import { InputComponent, ButtonComponent, LinkComponent } from '@app/ui-kit';
import { environment } from '../../../environments/environment';
import { LoggerService, ScopedLogger } from '@services/logger.service';

type ResetState = 'validating' | 'invalid' | 'form' | 'done';

/**
 * Landing page for the password-reset link from the e-mail:
 * /reset-password?token=... — validates the token, lets the user choose a
 * new password, and confirms. Public route (no session required).
 */
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputComponent,
    ButtonComponent,
    LinkComponent
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
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
export class ResetPasswordComponent implements OnInit {
  password = '';
  repeatPassword = '';
  state = signal<ResetState>('validating');
  isLoading = signal(false);
  errorMessage = signal('');

  private token = '';
  private logger: ScopedLogger;
  private destroyRef = inject(DestroyRef);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  constructor(private loggerService: LoggerService) {
    this.logger = this.loggerService.createLogger('ResetPasswordComponent');
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.state.set('invalid');
      return;
    }

    this.http.get<{ valid?: boolean }>(
      `${environment.apiBaseUrl}/api/auth/validate-reset-token/${encodeURIComponent(this.token)}`
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => this.state.set(res?.valid === false ? 'invalid' : 'form'),
      error: () => this.state.set('invalid')
    });
  }

  onPasswordChange(): void {
    if (this.errorMessage()) {
      this.errorMessage.set('');
    }
  }

  onSubmit(): void {
    if (this.isLoading()) return;

    if (!this.password || this.password.length < 8) {
      this.errorMessage.set('The password must be at least 8 characters long.');
      return;
    }
    if (this.password !== this.repeatPassword) {
      this.errorMessage.set('The passwords do not match.');
      return;
    }

    this.isLoading.set(true);
    this.http.post<{ success?: boolean }>(
      `${environment.apiBaseUrl}/api/auth/reset-password`,
      { token: this.token, newPassword: this.password }
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.state.set('done');
      },
      error: (err) => {
        this.isLoading.set(false);
        const message: string = err?.error?.error || '';
        // The token died between page load and submit (expired, or superseded
        // by a newer reset request): don't leave the user on a dead form.
        if (/invalid or expired/i.test(message)) {
          this.state.set('invalid');
          return;
        }
        const details = err?.error?.details;
        this.errorMessage.set(
          Array.isArray(details) && details.length
            ? details.join(' ')
            : (message || 'Could not change the password. The link may have expired - request a new one.')
        );
        this.logger.error('Password reset failed', err);
      }
    });
  }
}
