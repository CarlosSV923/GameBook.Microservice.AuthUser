import { DomainValidationError } from '../../domain/shared/domain-validation-error.js';
import { PasswordPolicy } from '../../domain/users/password-policy.js';
import type { UserRepository } from '../../domain/users/user-repository.js';
import type { PasswordHasher } from '../ports/password-hasher.js';
import {
  SessionValidationError,
  type ValidateSessionUseCase,
} from './validate-session.js';

export interface ChangePasswordInput {
  readonly token: string;
  readonly currentPassword: string;
  readonly newPassword: string;
}

export class InvalidCurrentPasswordError extends Error {
  constructor() {
    super('The current password is invalid.');
    this.name = 'InvalidCurrentPasswordError';
  }
}

export class ChangePasswordValidationError extends Error {
  constructor(
    public readonly field: string,
    public readonly reason: string,
  ) {
    super('The password change data is invalid.');
    this.name = 'ChangePasswordValidationError';
  }
}

export class ChangePasswordUseCase {
  constructor(
    private readonly validateSession: ValidateSessionUseCase,
    private readonly passwordHasher: PasswordHasher,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    const session = await this.validateSession.validate(input.token);
    const currentPasswordMatches = await this.passwordHasher.verify(
      input.currentPassword,
      session.user.passwordHash,
    );

    if (!currentPasswordMatches) {
      throw new InvalidCurrentPasswordError();
    }

    try {
      PasswordPolicy.assertValid(input.newPassword);
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw new ChangePasswordValidationError('newPassword', error.code);
      }

      throw error;
    }

    const passwordHash = await this.passwordHasher.hash(input.newPassword);
    const replaced = await this.userRepository.replacePassword(
      session.user.id,
      passwordHash,
      session.claims.ver,
    );

    if (!replaced) {
      throw new SessionValidationError('SESSION_REVOKED');
    }
  }
}
