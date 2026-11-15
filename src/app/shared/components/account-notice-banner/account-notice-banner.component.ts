import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { catchError, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { AuthService } from '@core/auth/auth.service';
import { User, canShop, hasFunctionalRole, isClientAgent } from '@core/models';
import { AgentService, ManagedClientResponse } from '@core/services/http/agent.service';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';

export interface AccountNotice {
  /** Stable id — also the per-session dismissal key. */
  id: 'no-role' | 'no-delivery-address' | 'customers-no-delivery-address';
  title: string;
  text: string;
}

/** "Acme", "Acme and Beta", "Acme, Beta and Gamma", "Acme, Beta, Gamma and 2 more". */
function listNames(names: string[], max = 3): string {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  if (rest > 0) {
    return `${shown.join(', ')} and ${rest} more`;
  }
  if (shown.length <= 1) {
    return shown[0] ?? '';
  }
  return `${shown.slice(0, -1).join(', ')} and ${shown[shown.length - 1]}`;
}

/**
 * Which account problem (if any) stops this user from ordering. Exported so it can be
 * unit-tested without the component.
 *
 * Agents never order for their own company, so its missing address is irrelevant to
 * them; instead they are warned about the customers (`managedClients`) they cannot
 * order for.
 */
export function accountNoticeFor(user: User | null, managedClients: ManagedClientResponse[] | null = null): AccountNotice | null {
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
  if (isClientAgent(user)) {
    const missing = (managedClients ?? []).filter(client => client.hasActiveDeliveryAddress === false);
    if (missing.length === 0) {
      return null;
    }
    const count = missing.length;
    return {
      id: 'customers-no-delivery-address',
      title: count === 1
        ? '1 of your customers has no delivery address on file.'
        : `${count} of your customers have no delivery address on file.`,
      text: `Orders for ${listNames(missing.map(client => client.name))} can't be placed until your Starlinger contact adds one.`
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
 * for their company (for agents: for the customers they manage) — instead of leaving
 * them with an empty top bar or a greyed-out "Place order". Dismissable per notice for
 * the browser session; it comes back on the next visit while the problem persists.
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
  private readonly agentService = inject(AgentService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly user = toSignal(this.authService.currentUser$, { initialValue: this.authService.getCurrentUser() });
  private readonly dismissedId = signal<string | null>(null);

  /**
   * The agent's customers, loaded once per agent session (only agents trigger the
   * request; a failure just hides the customer notice). Null for everyone else.
   */
  private readonly managedClients = toSignal(
    this.authService.currentUser$.pipe(
      map(user => isClientAgent(user)),
      distinctUntilChanged(),
      switchMap(isAgent => isAgent
        ? this.agentService.getManagedClients().pipe(
            map(response => response.member ?? []),
            catchError(() => of([] as ManagedClientResponse[]))
          )
        : of(null))
    ),
    { initialValue: null }
  );

  readonly notice = computed<AccountNotice | null>(() => {
    const notice = accountNoticeFor(this.user(), this.managedClients());
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
