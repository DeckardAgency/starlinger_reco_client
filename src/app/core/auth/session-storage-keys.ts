/**
 * localStorage entries that belong to the signed-in user's session rather than to the
 * browser: the cart, the wishlist and a client agent's selected customer. They are not
 * keyed per user, so AuthService removes every one of them whenever a session ends
 * (logout, forced logout after a failed token refresh, idle timeout) — otherwise the
 * next person on a shared browser would see the previous user's data.
 *
 * Kept in a dependency-free file so AuthService and the owning services can both import
 * the keys without importing each other.
 */
export const CART_STORAGE_KEY = 'cart_items';
export const WISHLIST_STORAGE_KEY = 'wishlist_items';
export const AGENT_SELECTED_CLIENT_STORAGE_KEY = 'agentSelectedClient';

export const SESSION_SCOPED_STORAGE_KEYS: readonly string[] = [
  CART_STORAGE_KEY,
  WISHLIST_STORAGE_KEY,
  AGENT_SELECTED_CLIENT_STORAGE_KEY,
];
