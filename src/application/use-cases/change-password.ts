import { DomainValidationError } from '../../domain/shared/domain-validation-error.ts';
import { PasswordPolicy } from '../../domain/users/password-policy.ts';
import type { UserRepository } from '../../domain/users/user-repository.ts';
import type { PasswordHasher } from '../ports/password-hasher.ts';
import type { AuthenticatedIdentity } from '../authenticated-identity.ts';
import { SessionValidationError } from './validate-session.ts';

export interface ChangePasswordInput {
  readonly session: AuthenticatedIdentity;
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
    private readonly passwordHasher: PasswordHasher,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    const user = await this.userRepository.findById(input.session.userId);
    if (
      !user ||
      user.isDisabled ||
      user.sessionVersion !== input.session.sessionVersion
    ) {
      throw new SessionValidationError(
        user?.isDisabled ? 'ACCOUNT_DISABLED' : 'SESSION_REVOKED',
      );
    }
    const currentPasswordMatches = await this.passwordHasher.verify(
      input.currentPassword,
      user.passwordHash,
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
    const expectedSessionVersion = input.session.sessionVersion;
    user.changePassword(passwordHash);
    const saved = await this.userRepository.save(user, expectedSessionVersion);

    if (!saved) {
      throw new SessionValidationError('SESSION_REVOKED');
    }
  }
}
