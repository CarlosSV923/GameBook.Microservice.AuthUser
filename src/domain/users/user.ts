import { randomUUID } from 'node:crypto';
import { DomainValidationError } from '../shared/domain-validation-error.js';
import { EmailAddress } from './email-address.js';

const USER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const MAX_FULL_NAME_LENGTH = 120;

export interface UserPersistence {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly sessionVersion: number;
}

interface UserState {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  sessionVersion: number;
}

export interface NewUser {
  readonly fullName: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly id?: string;
}

export class User {
  private constructor(private state: UserState) {}

  static create(input: NewUser): User {
    const fullName = input.fullName.trim();

    if (fullName.length === 0 || fullName.length > MAX_FULL_NAME_LENGTH) {
      throw new DomainValidationError(
        'FULL_NAME_INVALID',
        'The full name is invalid.',
      );
    }

    const id = input.id ?? randomUUID();
    User.assertValidId(id);

    if (input.passwordHash.trim().length === 0) {
      throw new DomainValidationError(
        'PASSWORD_HASH_INVALID',
        'The password hash is invalid.',
      );
    }

    return new User({
      id,
      fullName,
      email: EmailAddress.create(input.email).value,
      passwordHash: input.passwordHash,
      sessionVersion: 1,
    });
  }

  static rehydrate(state: UserPersistence): User {
    const user = User.create({
      id: state.id,
      fullName: state.fullName,
      email: state.email,
      passwordHash: state.passwordHash,
    });

    if (
      !Number.isSafeInteger(state.sessionVersion) ||
      state.sessionVersion < 1
    ) {
      throw new DomainValidationError(
        'SESSION_VERSION_INVALID',
        'The session version is invalid.',
      );
    }

    return new User({
      ...user.toPersistence(),
      sessionVersion: state.sessionVersion,
    });
  }

  get id(): string {
    return this.state.id;
  }

  get fullName(): string {
    return this.state.fullName;
  }

  get email(): string {
    return this.state.email;
  }

  get passwordHash(): string {
    return this.state.passwordHash;
  }

  get sessionVersion(): number {
    return this.state.sessionVersion;
  }

  changePasswordHash(passwordHash: string): void {
    if (passwordHash.trim().length === 0) {
      throw new DomainValidationError(
        'PASSWORD_HASH_INVALID',
        'The password hash is invalid.',
      );
    }

    if (this.state.sessionVersion === Number.MAX_SAFE_INTEGER) {
      throw new DomainValidationError(
        'SESSION_VERSION_EXHAUSTED',
        'The session version cannot be increased.',
      );
    }

    this.state.passwordHash = passwordHash;
    this.state.sessionVersion += 1;
  }

  toPersistence(): UserPersistence {
    return { ...this.state };
  }

  private static assertValidId(id: string): void {
    if (!USER_ID_PATTERN.test(id)) {
      throw new DomainValidationError(
        'USER_ID_INVALID',
        'The user ID is invalid.',
      );
    }
  }
}
