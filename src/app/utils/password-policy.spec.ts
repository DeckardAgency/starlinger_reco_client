import { apiErrorMessage, validatePassword } from './password-policy';

describe('password policy', () => {
  it('accepts a password with 8+ characters, upper case, lower case and a digit', () => {
    expect(validatePassword('Abcdefg1')).toBeNull();
  });

  it('rejects short passwords', () => {
    expect(validatePassword('Abc1')).toContain('at least 8 characters');
    expect(validatePassword('')).toContain('at least 8 characters');
    expect(validatePassword(null)).toContain('at least 8 characters');
  });

  it('rejects passwords missing an uppercase letter, a lowercase letter or a digit', () => {
    for (const pw of ['abcdefg1', 'ABCDEFG1', 'Abcdefgh']) {
      expect(validatePassword(pw)).toContain('uppercase letter');
    }
  });
});

describe('apiErrorMessage', () => {
  const fallback = 'Fallback';

  it('joins API Platform violations', () => {
    const err = { status: 422, error: { violations: [{ propertyPath: 'plainPassword', message: 'Too weak.' }] } };
    expect(apiErrorMessage(err, fallback)).toBe('Too weak.');
  });

  it('joins the auth controllers\' details list, else uses error / detail', () => {
    expect(apiErrorMessage({ error: { error: 'Invalid', details: ['One.', 'Two.'] } }, fallback)).toBe('One. Two.');
    expect(apiErrorMessage({ error: { error: 'Invalid' } }, fallback)).toBe('Invalid');
    expect(apiErrorMessage({ error: { detail: 'Denied' } }, fallback)).toBe('Denied');
  });

  it('falls back when the body carries no message', () => {
    expect(apiErrorMessage({ status: 0, error: null }, fallback)).toBe(fallback);
    expect(apiErrorMessage({ error: 'plain text' }, fallback)).toBe(fallback);
    expect(apiErrorMessage(undefined, fallback)).toBe(fallback);
  });
});
