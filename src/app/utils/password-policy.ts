/**
 * The one password policy of the webshop, shared by every form that sets a password
 * (reset link, invitation accept, change own password). It mirrors the backend rule,
 * which enforces the same policy on all paths and answers 422 on a violation — the
 * client-side check only exists so the user gets the explanation before submitting.
 */
export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_RULES_HINT =
  `At least ${PASSWORD_MIN_LENGTH} characters, with an uppercase letter, a lowercase letter and a number.`;

/** Returns the message for the first violated rule, or null when the password is acceptable. */
export function validatePassword(password: string | null | undefined): string | null {
  const pw = password ?? '';
  if (pw.length < PASSWORD_MIN_LENGTH) {
    return `The password must be at least ${PASSWORD_MIN_LENGTH} characters long.`;
  }
  if (!/[A-Z]/.test(pw) || !/[a-z]/.test(pw) || !/[0-9]/.test(pw)) {
    return 'The password must contain an uppercase letter, a lowercase letter and a number.';
  }
  return null;
}

/**
 * Extract the human-readable message from a failed API call, falling back to `fallback`.
 * Understands the shapes the backend uses: API Platform validation errors
 * (`violations[].message`, `detail`), and the auth controllers' `{ error, details[] }`.
 */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const body = (err as { error?: unknown } | null)?.error;
  if (!body || typeof body !== 'object') {
    return fallback;
  }
  const b = body as Record<string, unknown>;

  const list = (value: unknown): string[] =>
    Array.isArray(value)
      ? value
          .map(item => (typeof item === 'string' ? item : (item as { message?: unknown } | null)?.message))
          .filter((m): m is string => typeof m === 'string' && m.trim() !== '')
      : [];

  const messages = [...list(b['details']), ...list(b['violations'])];
  if (messages.length) {
    return messages.join(' ');
  }
  for (const key of ['error', 'detail', 'hydra:description', 'description', 'message']) {
    const value = b[key];
    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }
  return fallback;
}
