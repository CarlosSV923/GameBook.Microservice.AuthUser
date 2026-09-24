import { DomainValidationError } from '../shared/domain-validation-error.js';

const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export class EmailAddress {
  private constructor(public readonly value: string) {}

  static create(input: string): EmailAddress {
    const normalized = input.trim().toLowerCase();

    if (
      normalized.length === 0 ||
      normalized.length > MAX_EMAIL_LENGTH ||
      !EMAIL_PATTERN.test(normalized)
    ) {
      throw new DomainValidationError(
        'EMAIL_INVALID',
        'The email address is invalid.',
      );
    }

    return new EmailAddress(normalized);
  }

  equals(other: EmailAddress): boolean {
    return this.value === other.value;
  }
}
