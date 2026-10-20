import { TestBed } from '@angular/core/testing';
import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ForClientInterceptor } from './for-client.interceptor';
import { AuthService } from '@core/auth/auth.service';
import { AgentClientSelectionService } from '@core/services/agent-client-selection.service';
import { USER_ROLES } from '@core/models/auth.model';
import { ManagedClientResponse } from '@core/services/http/agent.service';

const CLIENT: ManagedClientResponse = { id: 318355, name: 'Managed Client 01', code: 'MC01', isActive: true, isArchived: false };

describe('ForClientInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  function setup(isAgent: boolean, selected: ManagedClientResponse | null): void {
    const authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['hasRole']);
    authSpy.hasRole.and.callFake((role: string) => isAgent && role === USER_ROLES.CLIENT_AGENT);
    const selectionSpy = jasmine.createSpyObj<AgentClientSelectionService>('AgentClientSelectionService', ['getSelectedClient']);
    selectionSpy.getSelectedClient.and.returnValue(selected);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: HTTP_INTERCEPTORS, useClass: ForClientInterceptor, multi: true },
        { provide: AuthService, useValue: authSpy },
        { provide: AgentClientSelectionService, useValue: selectionSpy }
      ]
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  }

  afterEach(() => httpMock.verify());

  /** Issues a request and returns the `forClient` param the backend would receive (null if none). */
  function sentForClient(url: string, method = 'GET', params?: Record<string, string | string[]>): string | null {
    http.request(method, url, { params }).subscribe();
    const req = httpMock.expectOne(r => r.url === url && r.method === method);
    req.flush({});
    return req.request.params.get('forClient');
  }

  it('tags product GETs (collection, item, random, absolute URL) for an agent with a selected client', () => {
    setup(true, CLIENT);
    expect(sentForClient('/api/v1/products')).toBe('318355');
    expect(sentForClient('/api/v1/products/42')).toBe('318355');
    expect(sentForClient('/api/v1/products/random')).toBe('318355');
    expect(sentForClient('https://api.example.com/api/v1/products')).toBe('318355');
  });

  it('keeps existing query params (id[] batches) when adding forClient', () => {
    setup(true, CLIENT);
    http.get('/api/v1/products', { params: { 'id[]': ['1', '2'], itemsPerPage: '100' } }).subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/v1/products');
    req.flush({});
    expect(req.request.params.getAll('id[]')).toEqual(['1', '2']);
    expect(req.request.params.get('itemsPerPage')).toBe('100');
    expect(req.request.params.get('forClient')).toBe('318355');
  });

  it('does not touch other resources whose path starts with /products', () => {
    setup(true, CLIENT);
    expect(sentForClient('/api/v1/product_groups')).toBeNull();
    expect(sentForClient('/api/v1/product_product_links')).toBeNull();
    expect(sentForClient('/api/v1/productsx')).toBeNull();
    expect(sentForClient('/api/v1/orders')).toBeNull();
  });

  it('does not touch non-GET product requests', () => {
    setup(true, CLIENT);
    expect(sentForClient('/api/v1/products', 'POST')).toBeNull();
    expect(sentForClient('/api/v1/products/42', 'PATCH')).toBeNull();
  });

  it('never tags for a non-agent, even with a stale selection', () => {
    setup(false, CLIENT);
    expect(sentForClient('/api/v1/products')).toBeNull();
  });

  it('does not tag when the agent has no client selected', () => {
    setup(true, null);
    expect(sentForClient('/api/v1/products')).toBeNull();
  });

  it('leaves an explicitly provided forClient alone', () => {
    setup(true, CLIENT);
    expect(sentForClient('/api/v1/products', 'GET', { forClient: '7' })).toBe('7');
  });
});
