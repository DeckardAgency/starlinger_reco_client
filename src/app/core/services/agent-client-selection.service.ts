import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, EMPTY, Observable } from 'rxjs';
import { distinctUntilChanged, skip } from 'rxjs/operators';
import { ManagedClientResponse } from './http/agent.service';
import { AuthService } from '@core/auth/auth.service';
import { USER_ROLES } from '@core/models/auth.model';
import { AGENT_SELECTED_CLIENT_STORAGE_KEY } from '@core/auth/session-storage-keys';

const AGENT_ROLE = USER_ROLES.CLIENT_AGENT;
const STORAGE_KEY = AGENT_SELECTED_CLIENT_STORAGE_KEY;

/**
 * Holds the "currently selected" managed client for a client agent. The
 * selection drives on-behalf-of ordering across the shop/checkout flow, decides
 * which client the shop's prices are shown for (see ForClientInterceptor), and
 * is persisted in localStorage so it survives reloads.
 */
@Injectable({ providedIn: 'root' })
export class AgentClientSelectionService {
  private selectedClientSubject = new BehaviorSubject<ManagedClientResponse | null>(null);
  public selectedClient$ = this.selectedClientSubject.asObservable();

  /**
   * Fires when the agent switches to a *different* client — or back to their own
   * company (null) — and never with the current selection on subscribe. Product
   * views subscribe to this to re-price what they show.
   */
  public selectedClientChanges$: Observable<ManagedClientResponse | null> = this.selectedClient$.pipe(
    distinctUntilChanged((a, b) => a?.id === b?.id),
    skip(1)
  );

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private auth: AuthService,
  ) {
    // Restore from localStorage on init
    if (isPlatformBrowser(this.platformId)) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          this.selectedClientSubject.next(JSON.parse(saved));
        }
      } catch {
        // Ignore invalid JSON / unavailable storage
      }
    }

    // An "on behalf of" client only belongs to a client agent. Whenever the
    // current user is not an agent (logged out, token expired, or a non-agent
    // signed in on the same browser), drop any selection so it can't leak
    // across users and trigger agent-only requests.
    (this.auth.currentUser$ ?? EMPTY)
      .pipe(takeUntilDestroyed())
      .subscribe(user => {
        const isAgent = !!user?.roles?.includes(AGENT_ROLE);
        if (!isAgent && this.selectedClientSubject.value) {
          this.clearSelection();
        }
      });
  }

  selectClient(client: ManagedClientResponse): void {
    this.selectedClientSubject.next(client);
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(client));
      } catch { /* storage unavailable */ }
    }
  }

  clearSelection(): void {
    this.selectedClientSubject.next(null);
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch { /* storage unavailable */ }
    }
  }

  getSelectedClient(): ManagedClientResponse | null {
    return this.selectedClientSubject.value;
  }

  /**
   * Reconcile the cached selection against a freshly-fetched list of managed
   * clients. If the cached client is no longer in the list (e.g. it was
   * deleted in the backend), clear the selection; otherwise replace the cached
   * copy with the fresh one so server-computed fields (delivery address flag,
   * purchase limit, open payments) stay current. Same id → no re-pricing
   * (selectedClientChanges$ dedups by id).
   *
   * Returns true if the cached selection is still valid (or there was no
   * selection to begin with), false if it had to be cleared.
   */
  validateAgainstList(clients: ManagedClientResponse[]): boolean {
    const current = this.selectedClientSubject.value;
    if (!current) {
      return true;
    }
    const fresh = clients.find(c => c.id === current.id);
    if (!fresh) {
      this.clearSelection();
      return false;
    }
    this.selectClient(fresh);
    return true;
  }
}
