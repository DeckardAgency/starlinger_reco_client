import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';

@Component({
  selector: 'app-no-client',
  standalone: true,
  template: `
    <div class="no-client">
      <div class="no-client__card">
        <div class="no-client__icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h1 class="no-client__title">Account Not Configured</h1>
        <p class="no-client__message">
          Your account has not been assigned to a client yet.
          Please contact your administrator to complete your account setup.
        </p>
        <button class="no-client__button" (click)="logout()">Log out</button>
      </div>
    </div>
  `,
  styles: [`
    .no-client {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #f4f4f5;
      padding: 24px;
    }

    .no-client__card {
      background: white;
      border-radius: 12px;
      padding: 48px;
      max-width: 460px;
      width: 100%;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .no-client__icon {
      margin-bottom: 24px;
    }

    .no-client__title {
      font-family: 'Inter', sans-serif;
      font-size: 20px;
      font-weight: 600;
      color: #18181b;
      margin: 0 0 12px 0;
    }

    .no-client__message {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #71717a;
      margin: 0 0 32px 0;
    }

    .no-client__button {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 500;
      padding: 10px 24px;
      border: 1px solid #d4d4d8;
      border-radius: 8px;
      background: white;
      color: #18181b;
      cursor: pointer;
      transition: background 0.15s;
    }

    .no-client__button:hover {
      background: #f4f4f5;
    }
  `]
})
export class NoClientComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
