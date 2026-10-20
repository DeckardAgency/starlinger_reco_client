import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from '@core/auth/auth.service';
import { AgentClientSelectionService } from '@core/services/agent-client-selection.service';
import { USER_ROLES } from '@core/models/auth.model';

/** Query parameter the products API reads to price the response for a managed client. */
export const FOR_CLIENT_PARAM = 'forClient';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * The products resource path (`/api/v1/products`) followed by `/`, `?`, `#` or the end of
 * the URL — so `/api/v1/product_groups` and `/api/v1/product_product_links` never match.
 * Only the path is tested: `apiBaseUrl` is '' in dev and an absolute URL on staging/prod,
 * so the match must not depend on the origin.
 */
const PRODUCTS_URL = new RegExp(`${escapeRegExp(environment.apiPath)}/products(?=[/?#]|$)`);

/**
 * Client agents browse the shop on behalf of a managed client. Every product read
 * (`GET /api/v1/products…`: collection, item, `?id[]=` batches, random) is tagged with
 * `forClient=<id>` so the backend prices it for that client (discount or markup) instead
 * of the agent's own company. Non-agents, and agents with no client selected, send the
 * request unchanged. Runs during SSR too, where the selection is always empty (no
 * storage), so the server never adds the param.
 */
@Injectable()
export class ForClientInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private agentSelection: AgentClientSelectionService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (request.method !== 'GET' || !PRODUCTS_URL.test(request.url) || request.params.has(FOR_CLIENT_PARAM)) {
      return next.handle(request);
    }
    if (!this.authService.hasRole(USER_ROLES.CLIENT_AGENT)) {
      return next.handle(request);
    }
    const client = this.agentSelection.getSelectedClient();
    if (!client) {
      return next.handle(request);
    }
    return next.handle(request.clone({ setParams: { [FOR_CLIENT_PARAM]: String(client.id) } }));
  }
}
