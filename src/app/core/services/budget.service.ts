import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@core/auth/auth.service';
import { isClientAgent } from '@core/models/auth.model';
import { AgentClientSelectionService } from '@core/services/agent-client-selection.service';
import { AgentService } from '@core/services/http/agent.service';

/** Purchase-limit figures (EUR) of the company that is currently being ordered for. */
export interface Budget {
  /** Purchase limit; always > 0 here (no limit → no budget). */
  limit: number;
  /** Open payments: unpaid, non-cancelled orders. */
  open: number;
  /** max(limit − open, 0) — the strip shows "Exceeded by" when open > limit. */
  remaining: number;
  /** Agents: the customer the figures belong to. */
  customerName?: string;
}

/** API Platform serializes decimals as strings ("1000.00"); /api/me sends numbers. */
function toAmount(value: string | number | null | undefined): number {
  const n = typeof value === 'string' ? parseFloat(value) : value ?? 0;
  return Number.isFinite(n) ? n : 0;
}

/**
 * The purchase-limit figures shown in the budget strip. Customers see their own
 * company's (`/api/me` → `client`); agents never order for their own company, so
 * they see the selected customer's (`GET agent/managed-clients`) — or nothing while
 * no customer is selected.
 */
@Injectable({ providedIn: 'root' })
export class BudgetService {
  private readonly auth = inject(AuthService);
  private readonly agentSelection = inject(AgentClientSelectionService);
  private readonly agentService = inject(AgentService);

  private readonly user = toSignal(this.auth.currentUser$, { initialValue: this.auth.getCurrentUser() });
  private readonly selectedClient = toSignal(this.agentSelection.selectedClient$, {
    initialValue: this.agentSelection.getSelectedClient()
  });

  readonly budget = computed<Budget | null>(() => {
    const user = this.user();
    if (!user) {
      return null;
    }

    let limit: number;
    let open: number;
    let customerName: string | undefined;

    if (isClientAgent(user)) {
      const client = this.selectedClient();
      if (!client) {
        return null;
      }
      limit = toAmount(client.purchaseLimit);
      open = toAmount(client.amountSpent);
      customerName = client.name;
    } else {
      limit = toAmount(user.client?.purchaseLimit);
      open = toAmount(user.client?.amountSpent);
    }

    if (limit <= 0) {
      return null;
    }
    return { limit, open, remaining: Math.max(limit - open, 0), ...(customerName ? { customerName } : {}) };
  });

  /**
   * Re-fetch the figures after something changed them (an order was placed).
   * Customers: /api/me again; agents: the managed-clients list, which refreshes
   * the selected customer in place.
   */
  refresh(): void {
    if (isClientAgent(this.user())) {
      this.agentService.getManagedClients().subscribe({
        next: response => this.agentSelection.validateAgainstList(response.member ?? []),
        error: () => { /* the strip keeps the last known figures */ }
      });
      return;
    }
    this.auth.checkSession().subscribe();
  }
}
