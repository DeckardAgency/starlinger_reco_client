import { User, canShop, hasFunctionalRole, getPrimaryRoleLabel } from './auth.model';
import { accountNoticeFor } from '@shared/components/account-notice-banner/account-notice-banner.component';

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
});
