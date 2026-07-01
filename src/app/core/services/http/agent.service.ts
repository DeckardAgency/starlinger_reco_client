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
