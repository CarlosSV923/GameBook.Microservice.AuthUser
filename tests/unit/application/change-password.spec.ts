import type { PasswordHasher } from '../../../src/application/ports/password-hasher.ts';
import {
  ChangePasswordUseCase,
  InvalidCurrentPasswordError,
} from '../../../src/application/use-cases/change-password.ts';
import type { UserRepository } from '../../../src/domain/users/user-repository.ts';
import { User } from '../../../src/domain/users/user.ts';

describe('ChangePasswordUseCase', () => {
  const identity = {
    userId: '7b7f3d2e-6d8d-4e8c-9e0c-2a96f2fb11aa',
    sessionVersion: 3,
  };
  let user = createUser();
  const passwordHasher = {
    hash: vi.fn(),
    verify: vi.fn(),
  } as unknown as PasswordHasher;
  const userRepository = {
    findById: vi.fn(),
    save: vi.fn(),
  } as unknown as UserRepository;
  const useCase = new ChangePasswordUseCase(passwordHasher, userRepository);

  beforeEach(() => {
    vi.clearAllMocks();
    user = createUser();
    userRepository.findById = vi.fn().mockResolvedValue(user);
    passwordHasher.verify = vi.fn().mockResolvedValue(true);
    passwordHasher.hash = vi.fn().mockResolvedValue('scrypt$new');
    userRepository.save = vi.fn().mockResolvedValue(true);
  });

  it('changes the hash on the aggregate and saves against its prior version', async () => {
    await expect(
      useCase.execute({
        session: identity,
        currentPassword: 'OldPassword@2026',
        newPassword: 'NewPassword@2026',
      }),
    ).resolves.toBeUndefined();

    expect(userRepository.findById).toHaveBeenCalledWith(identity.userId);
    expect(passwordHasher.verify).toHaveBeenCalledWith(
      'OldPassword@2026',
      'scrypt$old',
    );
    expect(passwordHasher.hash).toHaveBeenCalledWith('NewPassword@2026');
    expect(user.passwordHash).toBe('scrypt$new');
    expect(user.sessionVersion).toBe(identity.sessionVersion + 1);
    expect(userRepository.save).toHaveBeenCalledWith(
      user,
      identity.sessionVersion,
    );
  });

  it('rejects an incorrect current password without changing the hash', async () => {
    passwordHasher.verify = vi.fn().mockResolvedValue(false);

    await expect(
      useCase.execute({
        session: identity,
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
        session: identity,
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
        session: identity,
        currentPassword: 'OldPassword@2026',
        newPassword: 'NewPassword@2026',
      }),
    ).rejects.toEqual(expect.objectContaining({ code: 'SESSION_REVOKED' }));
  });

  it('rejects an identity whose session version is stale', async () => {
    userRepository.findById = vi
      .fn()
      .mockResolvedValue(
        User.rehydrate({ ...user.toPersistence(), sessionVersion: 4 }),
      );

    await expect(
      useCase.execute({
        session: identity,
        currentPassword: 'OldPassword@2026',
        newPassword: 'NewPassword@2026',
      }),
    ).rejects.toEqual(expect.objectContaining({ code: 'SESSION_REVOKED' }));

    expect(passwordHasher.verify).not.toHaveBeenCalled();
  });

  function createUser(): User {
    return User.rehydrate({
      id: identity.userId,
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      passwordHash: 'scrypt$old',
      sessionVersion: identity.sessionVersion,
    });
  }
});
