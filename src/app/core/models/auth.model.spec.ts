import { User, canShop, hasFunctionalRole, getPrimaryRoleLabel } from './auth.model';
import { accountNoticeFor } from '@shared/components/account-notice-banner/account-notice-banner.component';
import { ManagedClientResponse } from '@core/services/http/agent.service';

function managedClient(id: number, hasActiveDeliveryAddress: boolean): ManagedClientResponse {
  return { id, name: `Customer ${id}`, code: `C${id}`, isActive: true, isArchived: false, hasActiveDeliveryAddress };
}

function user(roles: string[], client?: Partial<User['client']>): User {
  return {
    id: 1, email: 'u@example.com', firstName: 'U', lastName: 'Ser', roles,
    client: client ? { '@id': '/api/v1/clients/1', '@type': 'Client', id: 1, name: 'Acme', code: 'AC', isActive: true, isArchived: false, ...client } : undefined
  } as User;
}

describe('auth.model role helpers', () => {
  it('ROLE_USER alone is not a functional role; every real role is', () => {
    expect(hasFunctionalRole(user(['ROLE_USER']))).toBeFalse();
    expect(hasFunctionalRole(user([]))).toBeFalse();
    expect(hasFunctionalRole(null)).toBeFalse();
    for (const role of ['ROLE_CLIENT', 'ROLE_CLIENT_ADMIN', 'ROLE_USER_CLIENT_AGENT', 'ROLE_FINANCE', 'ROLE_ADMIN']) {
      expect(hasFunctionalRole(user([role, 'ROLE_USER']))).withContext(role).toBeTrue();
    }
  });

  it('finance is functional but cannot shop', () => {
    expect(canShop(user(['ROLE_FINANCE', 'ROLE_USER']))).toBeFalse();
  });

  it('labels the most specific functional role, not roles[1]', () => {
    expect(getPrimaryRoleLabel(user(['ROLE_CLIENT', 'ROLE_USER']))).toBe('Customer');
    expect(getPrimaryRoleLabel(user(['ROLE_USER', 'ROLE_CLIENT_ADMIN']))).toBe('Customer Admin');
    expect(getPrimaryRoleLabel(user(['ROLE_USER']))).toBe('User');
  });
});

describe('accountNoticeFor', () => {
  it('warns a role-less account first, then a company without delivery address', () => {
    expect(accountNoticeFor(user(['ROLE_USER'], { hasActiveDeliveryAddress: false }))?.id).toBe('no-role');
    expect(accountNoticeFor(user(['ROLE_CLIENT'], { hasActiveDeliveryAddress: false }))?.id).toBe('no-delivery-address');
  });

  it('stays silent when the flag is missing (older API), true, or the user cannot shop anyway', () => {
    expect(accountNoticeFor(user(['ROLE_CLIENT'], {}))).toBeNull();
    expect(accountNoticeFor(user(['ROLE_CLIENT'], { hasActiveDeliveryAddress: true }))).toBeNull();
    expect(accountNoticeFor(user(['ROLE_FINANCE'], { hasActiveDeliveryAddress: false }))).toBeNull();
    expect(accountNoticeFor(null)).toBeNull();
  });

  it('ignores an agent\'s own missing address (agents never order for their own company)', () => {
    const agent = user(['ROLE_USER_CLIENT_AGENT'], { hasActiveDeliveryAddress: false });
    expect(accountNoticeFor(agent)).toBeNull();
    expect(accountNoticeFor(agent, [])).toBeNull();
    expect(accountNoticeFor(agent, [managedClient(1, true)])).toBeNull();
  });

  it('warns an agent about the customers without a delivery address, naming them', () => {
    const agent = user(['ROLE_USER_CLIENT_AGENT'], { hasActiveDeliveryAddress: true });
    const notice = accountNoticeFor(agent, [managedClient(1, false), managedClient(2, true), managedClient(3, false)]);
    expect(notice?.id).toBe('customers-no-delivery-address');
    expect(notice?.title).toBe('2 of your customers have no delivery address on file.');
    expect(notice?.text).toContain('Customer 1 and Customer 3');

    expect(accountNoticeFor(agent, [managedClient(1, false)])?.title).toBe('1 of your customers has no delivery address on file.');

    const many = [1, 2, 3, 4, 5].map(id => managedClient(id, false));
    expect(accountNoticeFor(agent, many)?.text).toContain('Customer 1, Customer 2, Customer 3 and 2 more');
  });
});
