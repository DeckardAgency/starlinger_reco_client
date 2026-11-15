import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseHttpService } from './base-http.service';

/**
 * A client managed by the current agent company, as returned by
 * GET /api/v1/agent/managed-clients.
 */
export interface ManagedClientResponse {
  '@id'?: string;
  '@type'?: string;
  id: number;
  name: string;
  code: string;
  description?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  vatNumber?: string;
  isActive: boolean;
  isArchived: boolean;
  maxActiveUsers?: number;
  /** Server-computed: false means the customer has no active delivery address → no orders for it. */
  hasActiveDeliveryAddress?: boolean;
  /** Decimal strings from API Platform (e.g. "1000.00"); null/0 = no limit. */
  purchaseLimit?: string | null;
  /** Open payments: sum of the customer's unpaid, non-cancelled orders (decimal string). */
  amountSpent?: string | null;
  isClientAgent?: boolean;
}

export interface ManagedClientsCollection {
  '@context'?: string;
  '@id'?: string;
  '@type'?: string;
  totalItems: number;
  member: ManagedClientResponse[];
}

/**
 * AgentService — endpoints available only to users with ROLE_USER_CLIENT_AGENT.
 */
@Injectable({
  providedIn: 'root'
})
export class AgentService extends BaseHttpService {

  /**
   * Get all clients managed by the current agent user.
   */
  getManagedClients(): Observable<ManagedClientsCollection> {
    return this.getWithJsonLd<ManagedClientsCollection>(
      this.buildUrl('agent', 'managed-clients')
    );
  }
}
