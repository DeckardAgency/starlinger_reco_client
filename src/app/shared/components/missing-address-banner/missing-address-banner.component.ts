import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@core/auth/auth.service';
import { canShop } from '@core/models';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';

const DISMISSED_KEY = 'missingAddressBannerDismissed';

/**
 * Tells users who could order that their company has no active delivery address on
 * file (server-computed `client.hasActiveDeliveryAddress` from /api/me), so they learn
 * it on the first page instead of at a greyed-out "Place order" button. Dismissable
 * for the browser session; it comes back on the next visit while the data is missing.
 */
@Component({
  selector: 'app-missing-address-banner',
  imports: [IconComponent],
  templateUrl: './missing-address-banner.component.html',
  styleUrl: './missing-address-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MissingAddressBannerComponent {
  private readonly authService = inject(AuthService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly user = toSignal(this.authService.currentUser$, { initialValue: this.authService.getCurrentUser() });
  private readonly dismissed = signal(this.readDismissed());

  /** Strict `=== false`: an API without the flag (older backend) shows nothing. */
  readonly visible = computed(() => {
    const user = this.user();
    return !this.dismissed() && canShop(user) && user?.client?.hasActiveDeliveryAddress === false;
  });

  dismiss(): void {
    this.dismissed.set(true);
    try {
      sessionStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // Storage unavailable (private mode, SSR) — dismissal just won't survive a reload.
    }
  }

  private readDismissed(): boolean {
    if (!this.isBrowser) {
      return false;
    }
    try {
      return sessionStorage.getItem(DISMISSED_KEY) === '1';
    } catch {
      return false;
    }
  }
}
