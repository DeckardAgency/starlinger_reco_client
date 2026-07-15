/**
 * Development user credentials + profile (used by AuthService as a dev fallback).
 * Kept in a tiny standalone file so importing it does NOT pull the mock data set
 * into the production bundle.
 *
 * These are local-only: dummyLogin() compares against them in-memory and never
 * calls the backend, and useDummyAuth is false in every committed environment.
 * The values use an obviously-fake domain on purpose so they can never match a
 * real backend account.
 */

export const DUMMY_USER_CREDENTIALS = {
  email: 'dev-user@example.test',
  password: 'local-dev-only'
};

export const mockDevelopmentUser = {
  id: 1,
  email: DUMMY_USER_CREDENTIALS.email,
  username: DUMMY_USER_CREDENTIALS.email,
  roles: ['ROLE_USER', 'ROLE_CLIENT'] as string[],
  firstName: 'Reco',
  lastName: 'Developer',
  phoneNumber: '+43 1 234 5678',
  isActive: true,
  client: {
    '@id': '/api/clients/dev-001',
    '@type': 'Client',
    id: 1,
    name: 'Starlinger Development',
    code: 'STL-DEV',
    isActive: true,
    isArchived: false,
    maxActiveUsers: 10
  }
};
