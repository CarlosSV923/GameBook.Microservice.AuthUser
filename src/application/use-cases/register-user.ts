import { DomainValidationError } from '../../domain/shared/domain-validation-error.js';
import { EmailAddress } from '../../domain/users/email-address.js';
import { EmailAlreadyRegisteredError } from '../../domain/users/email-already-registered-error.js';
import { PasswordPolicy } from '../../domain/users/password-policy.js';
import { User } from '../../domain/users/user.js';
import type { UserRepository } from '../../domain/users/user-repository.js';
import type { PasswordHasher } from '../ports/password-hasher.js';

export interface RegisterUserInput {
  readonly fullName: string;
  readonly email: string;
  readonly password: string;
  readonly passwordConfirmation: string;
}

export interface RegisterUserOutput {
  readonly user: {
    readonly id: string;
    readonly fullName: string;
    readonly email: string;
  };
}

export class RegistrationValidationError extends Error {
  constructor(
    public readonly field: string,
    public readonly reason: string,
  ) {
    super('The registration data is invalid.');
    this.name = 'RegistrationValidationError';
  }
}

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    const email = this.parseEmail(input.email);

    if (input.password !== input.passwordConfirmation) {
      throw new RegistrationValidationError(
        'passwordConfirmation',
        'PASSWORD_CONFIRMATION_MISMATCH',
      );
    }

    try {
      PasswordPolicy.assertValid(input.password);
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw new RegistrationValidationError('password', error.code);
      }

      throw error;
    }

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new EmailAlreadyRegisteredError();
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = this.createUser(input, email, passwordHash);

    try {
      await this.userRepository.save(user);
    } catch (error) {
      if (error instanceof EmailAlreadyRegisteredError) {
        throw error;
      }

      throw error;
    }

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
    };
  }

  private parseEmail(value: string): EmailAddress {
    try {
      return EmailAddress.create(value);
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw new RegistrationValidationError('email', error.code);
      }

      throw error;
    }
  }

  private createUser(
    input: RegisterUserInput,
    email: EmailAddress,
    passwordHash: string,
  ): User {
    try {
      return User.create({
        fullName: input.fullName,
        email: email.value,
        passwordHash,
      });
    } catch (error) {
      if (error instanceof DomainValidationError) {
        const field = error.code === 'FULL_NAME_INVALID' ? 'fullName' : 'email';
        throw new RegistrationValidationError(field, error.code);
      }

      throw error;
    }
  }
}
