import { DisableAccountUseCase } from '../../../src/application/use-cases/disable-account.ts';
import type { UserRepository } from '../../../src/domain/users/user-repository.ts';
import { User } from '../../../src/domain/users/user.ts';

describe('DisableAccountUseCase', () => {
  const identity = {
    userId: '7b7f3d2e-6d8d-4e8c-9e0c-2a96f2fb11aa',
    sessionVersion: 3,
  };
  let user = createUser();
  const userRepository = {
    findById: vi.fn(),
    save: vi.fn(),
  } as unknown as UserRepository;
  const useCase = new DisableAccountUseCase(userRepository);

  beforeEach(() => {
    vi.clearAllMocks();
    user = createUser();
    userRepository.findById = vi.fn().mockResolvedValue(user);
    userRepository.save = vi.fn().mockResolvedValue(true);
  });

  it('disables the account using the authenticated session version', async () => {
    await expect(useCase.execute(identity)).resolves.toBeUndefined();

    expect(userRepository.findById).toHaveBeenCalledWith(identity.userId);
    expect(user.isDisabled).toBe(true);
    expect(user.sessionVersion).toBe(identity.sessionVersion + 1);
    expect(userRepository.save).toHaveBeenCalledWith(
      user,
      identity.sessionVersion,
    );
  });

  it('reports revocation when the atomic update loses a concurrent version race', async () => {
    userRepository.save = vi.fn().mockResolvedValue(false);

    await expect(useCase.execute(identity)).rejects.toEqual(
      expect.objectContaining({ code: 'SESSION_REVOKED' }),
    );
  });

  it('does not update the repository when the account is already disabled', async () => {
    user = User.rehydrate({ ...user.toPersistence(), isDisabled: true });
    userRepository.findById = vi.fn().mockResolvedValue(user);

    await expect(useCase.execute(identity)).rejects.toEqual(
      expect.objectContaining({ code: 'ACCOUNT_DISABLED' }),
    );
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  function createUser(): User {
    return User.rehydrate({
      id: identity.userId,
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      passwordHash: 'scrypt$fixture',
      sessionVersion: identity.sessionVersion,
    });
  }
});
