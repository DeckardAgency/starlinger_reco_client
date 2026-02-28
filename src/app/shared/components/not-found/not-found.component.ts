import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { AuthService } from '@core/auth/auth.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotFoundComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  goToDashboard(): void {
    // Client app always goes to customer dashboard
    this.router.navigate(['/customer/dashboard']);
  }
}
