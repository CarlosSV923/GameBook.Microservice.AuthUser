import type { JwtClaims } from '../../../src/application/ports/jwt-ports.ts';
import type { PasswordHasher } from '../../../src/application/ports/password-hasher.ts';
import {
  ChangePasswordUseCase,
  InvalidCurrentPasswordError,
} from '../../../src/application/use-cases/change-password.ts';
import {
  SessionValidationError,
  type ValidateSessionUseCase,
} from '../../../src/application/use-cases/validate-session.ts';
import type { UserRepository } from '../../../src/domain/users/user-repository.ts';
import { User } from '../../../src/domain/users/user.ts';

describe('ChangePasswordUseCase', () => {
  const claims: JwtClaims = {
    sub: '7b7f3d2e-6d8d-4e8c-9e0c-2a96f2fb11aa',
    ver: 3,
    iat: 1_700_000_000,
    exp: 1_700_003_600,
    iss: 'gamebook-auth',
    aud: 'gamebook-services',
  };
  let user = createUser();
  const validateSession = {
    validate: vi.fn(),
  } as unknown as ValidateSessionUseCase;
  const passwordHasher = {
    hash: vi.fn(),
    verify: vi.fn(),
  } as unknown as PasswordHasher;
  const userRepository = {
    save: vi.fn(),
  } as unknown as UserRepository;
  const useCase = new ChangePasswordUseCase(
    validateSession,
    passwordHasher,
    userRepository,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    user = createUser();
    validateSession.validate = vi.fn().mockResolvedValue({ user, claims });
    passwordHasher.verify = vi.fn().mockResolvedValue(true);
    passwordHasher.hash = vi.fn().mockResolvedValue('scrypt$new');
    userRepository.save = vi.fn().mockResolvedValue(true);
  });

  it('changes the hash on the aggregate and saves against its prior version', async () => {
    await expect(
      useCase.execute({
        token: 'signed.jwt.token',
        currentPassword: 'OldPassword@2026',
        newPassword: 'NewPassword@2026',
      }),
    ).resolves.toBeUndefined();

    expect(validateSession.validate).toHaveBeenCalledWith('signed.jwt.token');
    expect(passwordHasher.verify).toHaveBeenCalledWith(
      'OldPassword@2026',
      'scrypt$old',
    );
    expect(passwordHasher.hash).toHaveBeenCalledWith('NewPassword@2026');
    expect(user.passwordHash).toBe('scrypt$new');
    expect(user.sessionVersion).toBe(claims.ver + 1);
    expect(userRepository.save).toHaveBeenCalledWith(user, claims.ver);
  });

  it('rejects an incorrect current password without changing the hash', async () => {
    passwordHasher.verify = vi.fn().mockResolvedValue(false);

    await expect(
      useCase.execute({
        token: 'signed.jwt.token',
        currentPassword: 'WrongPassword@2026',
        newPassword: 'NewPassword@2026',
      }),
    ).rejects.toBeInstanceOf(InvalidCurrentPasswordError);

    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('rejects a new password that does not meet the policy', async () => {
    await expect(
      useCase.execute({
        token: 'signed.jwt.token',
        currentPassword: 'OldPassword@2026',
        newPassword: 'weakpassword',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        field: 'newPassword',
        reason: 'PASSWORD_POLICY_NOT_MET',
      }),
    );

    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('reports revocation when the atomic update loses a concurrent version race', async () => {
    userRepository.save = vi.fn().mockResolvedValue(false);

    await expect(
      useCase.execute({
        token: 'signed.jwt.token',
        currentPassword: 'OldPassword@2026',
        newPassword: 'NewPassword@2026',
      }),
    ).rejects.toEqual(expect.objectContaining({ code: 'SESSION_REVOKED' }));
  });

  it('does not continue when session validation fails', async () => {
    validateSession.validate = vi
      .fn()
      .mockRejectedValue(new SessionValidationError('TOKEN_EXPIRED'));

    await expect(
      useCase.execute({
        token: 'expired.jwt.token',
        currentPassword: 'OldPassword@2026',
        newPassword: 'NewPassword@2026',
      }),
    ).rejects.toEqual(expect.objectContaining({ code: 'TOKEN_EXPIRED' }));

    expect(passwordHasher.verify).not.toHaveBeenCalled();
  });

  function createUser(): User {
    return User.rehydrate({
      id: claims.sub,
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      passwordHash: 'scrypt$old',
      sessionVersion: claims.ver,
    });
  }
});
