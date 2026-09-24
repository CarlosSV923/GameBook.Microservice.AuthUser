import { DomainValidationError } from '../../../../src/domain/shared/domain-validation-error.js';
import { User } from '../../../../src/domain/users/user.js';

const userInput = {
  id: '7b7f3d2e-6d8d-4e8c-9e0c-2a96f2fb11aa',
  fullName: ' Ada Lovelace ',
  email: ' Ada.Lovelace@Example.TEST ',
  passwordHash: 'argon2id-hash',
};

describe('User', () => {
  it('creates a user with a UUID and the initial session version', () => {
    const user = User.create({ ...userInput, id: undefined });

    expect(user.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu,
    );
    expect(user.sessionVersion).toBe(1);
    expect(user.email).toBe('ada.lovelace@example.test');
    expect(user.fullName).toBe('Ada Lovelace');
  });

  it('increments the session version when the password hash changes', () => {
    const user = User.create(userInput);

    user.changePasswordHash('new-argon2id-hash');

    expect(user.passwordHash).toBe('new-argon2id-hash');
    expect(user.sessionVersion).toBe(2);
  });

  it('rehydrates a persisted session version without resetting it', () => {
    const user = User.rehydrate({
      ...userInput,
      email: 'ada.lovelace@example.test',
      fullName: 'Ada Lovelace',
      sessionVersion: 4,
    });

    expect(user.sessionVersion).toBe(4);
  });

  it('rejects an invalid persisted session version', () => {
    expect(() => User.rehydrate({ ...userInput, sessionVersion: 0 })).toThrow(
      DomainValidationError,
    );
  });
});
