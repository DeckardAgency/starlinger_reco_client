import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { AuthService } from '@core/auth/auth.service';
import { AgentClientSelectionService } from '@core/services/agent-client-selection.service';
import { NotificationService } from '@core/services/notification.service';
import { USER_ROLES } from '@core/models/auth.model';
import { ManagedClientResponse } from '@core/services/http/agent.service';
import { ShopProduct } from '@core/mocks/mock-data';

function product(id: number, qtyStep: number | null = 1): ShopProduct {
  return {
    id,
    code: `P${id}`,
    name: `Product ${id}`,
    price: 10,
    image: '',
    isFavorite: false,
    group: '',
    qtyStep,
  } as ShopProduct;
}

function managedClient(id: number): ManagedClientResponse {
  return { id, name: `Client ${id}`, code: `C${id}`, isActive: true, isArchived: false };
}

describe('CartService (client-agent flow)', () => {
  let service: CartService;
  let authSpy: jasmine.SpyObj<AuthService>;
  let selectionSpy: jasmine.SpyObj<AgentClientSelectionService>;
  let notificationSpy: jasmine.SpyObj<NotificationService>;

  function setup(isAgent: boolean, selected: ManagedClientResponse | null = null): void {
    localStorage.clear();
    TestBed.resetTestingModule();

    authSpy = jasmine.createSpyObj('AuthService', ['hasRole']);
    authSpy.hasRole.and.callFake((role: string) => isAgent && role === USER_ROLES.CLIENT_AGENT);

    selectionSpy = jasmine.createSpyObj('AgentClientSelectionService', ['getSelectedClient']);
    selectionSpy.getSelectedClient.and.returnValue(selected);

    notificationSpy = jasmine.createSpyObj('NotificationService', ['warning', 'success', 'info', 'error']);

    TestBed.configureTestingModule({
      providers: [
        CartService,
        { provide: AuthService, useValue: authSpy },
        { provide: AgentClientSelectionService, useValue: selectionSpy },
        { provide: NotificationService, useValue: notificationSpy },
      ],
    });
    service = TestBed.inject(CartService);
  }

  it('lets a normal customer add items without a client stamp', () => {
    setup(false);

    const added = service.addItem(product(1), 1);

    expect(added).toBeTrue();
    expect(service.cartItems().length).toBe(1);
    expect(service.cartItems()[0].clientId).toBeUndefined();
    expect(notificationSpy.warning).not.toHaveBeenCalled();
  });

  it('blocks an agent from adding when no client is selected', () => {
    setup(true, null);

    const added = service.addItem(product(1), 1);

    expect(added).toBeFalse();
    expect(service.cartItems().length).toBe(0);
    expect(notificationSpy.warning).toHaveBeenCalledTimes(1);
  });

  it('stamps the selected client onto the line for an agent', () => {
    setup(true, managedClient(7));

    const added = service.addItem(product(1), 1);

    expect(added).toBeTrue();
    const item = service.cartItems()[0];
    expect(item.clientId).toBe(7);
    expect(item.clientName).toBe('Client 7');
    expect(item.clientCode).toBe('C7');
  });

  it('merges quantity for the same product + same client', () => {
    setup(true, managedClient(7));

    service.addItem(product(1), 1);
    service.addItem(product(1), 1);

    expect(service.cartItems().length).toBe(1);
    expect(service.cartItems()[0].quantity).toBe(2);
  });

  it('keeps separate lines for the same product across different clients', () => {
    setup(true, managedClient(7));
    service.addItem(product(1), 1);

    // Agent switches the active client, then adds the same product again.
    selectionSpy.getSelectedClient.and.returnValue(managedClient(9));
    service.addItem(product(1), 1);

    expect(service.cartItems().length).toBe(2);
    expect(service.cartItems().map(i => i.clientId).sort()).toEqual([7, 9]);
  });
});
