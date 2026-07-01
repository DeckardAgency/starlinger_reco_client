import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, EMPTY } from 'rxjs';
import { ManagedClientResponse } from './http/agent.service';
import { AuthService } from '@core/auth/auth.service';
import { USER_ROLES } from '@core/models/auth.model';

const AGENT_ROLE = USER_ROLES.CLIENT_AGENT;
const STORAGE_KEY = 'agentSelectedClient';

/**
 * Holds the "currently selected" managed client for a client agent. The
 * selection drives on-behalf-of ordering across the shop/checkout flow and is
 * persisted in localStorage so it survives reloads.
 */
@Injectable({ providedIn: 'root' })
export class AgentClientSelectionService {
  private selectedClientSubject = new BehaviorSubject<ManagedClientResponse | null>(null);
  public selectedClient$ = this.selectedClientSubject.asObservable();

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private auth: AuthService,
  ) {
    // Restore from localStorage on init
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          this.selectedClientSubject.next(JSON.parse(saved));
        } catch {
          // Ignore invalid JSON
        }
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(client));
    }
  }

  clearSelection(): void {
    this.selectedClientSubject.next(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  getSelectedClient(): ManagedClientResponse | null {
    return this.selectedClientSubject.value;
  }

  /**
   * Reconcile the cached selection against a freshly-fetched list of managed
   * clients. If the cached client is no longer in the list (e.g. it was
   * deleted in the backend), clear the selection.
   *
   * Returns true if the cached selection is still valid (or there was no
   * selection to begin with), false if it had to be cleared.
   */
  validateAgainstList(clients: ManagedClientResponse[]): boolean {
    const current = this.selectedClientSubject.value;
    if (!current) {
      return true;
    }
    const stillExists = clients.some(c => c.id === current.id);
    if (!stillExists) {
      this.clearSelection();
      return false;
    }
    return true;
  }
}
