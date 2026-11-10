import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@core/auth/auth.service';
import { User, canShop, hasFunctionalRole } from '@core/models';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';

export interface AccountNotice {
  /** Stable id — also the per-session dismissal key. */
  id: 'no-role' | 'no-delivery-address';
  title: string;
  text: string;
}

/**
 * Which account problem (if any) stops this user from ordering. Exported so it can be
 * unit-tested without the component.
 */
export function accountNoticeFor(user: User | null): AccountNotice | null {
  if (!user) {
    return null;
  }
  if (!hasFunctionalRole(user)) {
    return {
      id: 'no-role',
      title: 'Your account has no webshop role yet.',
      text: 'You can sign in, but you cannot browse prices or place orders until your administrator assigns a role to your account.'
    };
  }
  if (canShop(user) && user.client?.hasActiveDeliveryAddress === false) {
    return {
      id: 'no-delivery-address',
      title: 'Your company has no delivery address on file.',
      text: "You can browse products and save drafts, but orders can't be placed until your Starlinger contact adds one."
    };
  }
  return null;
}

/**
 * Tells a signed-in user up front why they cannot order — no functional role on the
 * account, or (server-computed `client.hasActiveDeliveryAddress`) no delivery address
 * for their company — instead of leaving them with an empty top bar or a greyed-out
 * "Place order". Dismissable per notice for the browser session; it comes back on the
 * next visit while the problem persists.
 */
@Component({
  selector: 'app-account-notice-banner',
  imports: [IconComponent],
  templateUrl: './account-notice-banner.component.html',
  styleUrl: './account-notice-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountNoticeBannerComponent {
  private readonly authService = inject(AuthService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly user = toSignal(this.authService.currentUser$, { initialValue: this.authService.getCurrentUser() });
  private readonly dismissedId = signal<string | null>(null);

  readonly notice = computed<AccountNotice | null>(() => {
    const notice = accountNoticeFor(this.user());
    if (!notice || this.dismissedId() === notice.id || this.readDismissed(notice.id)) {
      return null;
    }
    return notice;
  });

  dismiss(): void {
    const notice = this.notice();
    if (!notice) {
      return;
    }
    this.dismissedId.set(notice.id);
    try {
      sessionStorage.setItem(this.storageKey(notice.id), '1');
    } catch {
      // Storage unavailable (private mode, SSR) — dismissal just won't survive a reload.
    }
  }

  private readDismissed(id: string): boolean {
    if (!this.isBrowser) {
      return false;
    }
    try {
      return sessionStorage.getItem(this.storageKey(id)) === '1';
    } catch {
      return false;
    }
  }

  private storageKey(id: string): string {
    return `accountNoticeDismissed:${id}`;
  }
}
