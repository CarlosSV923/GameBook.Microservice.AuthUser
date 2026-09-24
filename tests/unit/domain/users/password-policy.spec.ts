import { DomainValidationError } from '../../../../src/domain/shared/domain-validation-error.js';
import { PasswordPolicy } from '../../../../src/domain/users/password-policy.js';

describe('PasswordPolicy', () => {
  it('accepts the contract example shape', () => {
    expect(PasswordPolicy.isValid('GameBook@2026')).toBe(true);
  });

  it.each(['shortA1', 'lowercase1!', 'NoNumber!', 'NoSpecial1'])(
    'rejects %s',
    (password) => {
      expect(() => PasswordPolicy.assertValid(password)).toThrow(
        DomainValidationError,
      );
    },
  );
});
