import { DomainValidationError } from '../../../../src/domain/shared/domain-validation-error.js';
import { EmailAddress } from '../../../../src/domain/users/email-address.js';

describe('EmailAddress', () => {
  it('normalizes surrounding whitespace and casing', () => {
    expect(EmailAddress.create('  Ada.Lovelace@Example.TEST ').value).toBe(
      'ada.lovelace@example.test',
    );
  });

  it('rejects invalid addresses', () => {
    expect(() => EmailAddress.create('not-an-email')).toThrow(
      DomainValidationError,
    );
  });

  it('rejects addresses longer than the contract limit', () => {
    const localPart = 'a'.repeat(246);

    expect(() => EmailAddress.create(`${localPart}@example.test`)).toThrow(
      DomainValidationError,
    );
  });
});
