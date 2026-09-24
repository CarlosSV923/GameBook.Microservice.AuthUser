import { DomainValidationError } from '../shared/domain-validation-error.js';

const MIN_PASSWORD_LENGTH = 8;
const UPPERCASE_PATTERN = /[A-Z]/u;
const DIGIT_PATTERN = /[0-9]/u;
const SPECIAL_CHARACTER_PATTERN = /[^A-Za-z0-9]/u;

export class PasswordPolicy {
  static assertValid(password: string): void {
    if (
      password.length < MIN_PASSWORD_LENGTH ||
      !UPPERCASE_PATTERN.test(password) ||
      !DIGIT_PATTERN.test(password) ||
      !SPECIAL_CHARACTER_PATTERN.test(password)
    ) {
      throw new DomainValidationError(
        'PASSWORD_POLICY_NOT_MET',
        'The password does not meet the required policy.',
      );
    }
  }

  static isValid(password: string): boolean {
    try {
      PasswordPolicy.assertValid(password);
      return true;
    } catch (error) {
      if (error instanceof DomainValidationError) {
        return false;
      }

      throw error;
    }
  }
}
