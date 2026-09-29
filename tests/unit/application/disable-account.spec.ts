import type { JwtClaims } from '../../../src/application/ports/jwt-ports.ts';
import { DisableAccountUseCase } from '../../../src/application/use-cases/disable-account.ts';
import {
  SessionValidationError,
  type ValidateSessionUseCase,
} from '../../../src/application/use-cases/validate-session.ts';
import type { UserRepository } from '../../../src/domain/users/user-repository.ts';
import { User } from '../../../src/domain/users/user.ts';

describe('DisableAccountUseCase', () => {
  const claims: JwtClaims = {
    sub: '7b7f3d2e-6d8d-4e8c-9e0c-2a96f2fb11aa',
    ver: 3,
    iat: 1_700_000_000,
    exp: 1_700_003_600,
    iss: 'gamebook-auth',
    aud: 'gamebook-services',
  };
  const user = User.rehydrate({
    id: claims.sub,
    fullName: 'Ada Lovelace',
    email: 'ada@example.com',
    passwordHash: 'scrypt$fixture',
    sessionVersion: claims.ver,
  });
  const validateSession = {
    validate: vi.fn(),
  } as unknown as ValidateSessionUseCase;
  const userRepository = {
    disable: vi.fn(),
  } as unknown as UserRepository;
  const useCase = new DisableAccountUseCase(validateSession, userRepository);

  beforeEach(() => {
    vi.clearAllMocks();
    validateSession.validate = vi.fn().mockResolvedValue({ user, claims });
    userRepository.disable = vi.fn().mockResolvedValue(true);
  });

  it('disables the account using the authenticated session version', async () => {
    await expect(useCase.execute('signed.jwt.token')).resolves.toBeUndefined();

    expect(validateSession.validate).toHaveBeenCalledWith('signed.jwt.token');
    expect(userRepository.disable).toHaveBeenCalledWith(user.id, claims.ver);
  });

  it('reports revocation when the atomic update loses a concurrent version race', async () => {
    userRepository.disable = vi.fn().mockResolvedValue(false);

    await expect(useCase.execute('signed.jwt.token')).rejects.toEqual(
      expect.objectContaining({ code: 'SESSION_REVOKED' }),
    );
  });

  it('does not update the repository when session validation fails', async () => {
    validateSession.validate = vi
      .fn()
      .mockRejectedValue(new SessionValidationError('ACCOUNT_DISABLED'));

    await expect(useCase.execute('disabled.jwt.token')).rejects.toEqual(
      expect.objectContaining({ code: 'ACCOUNT_DISABLED' }),
    );
    expect(userRepository.disable).not.toHaveBeenCalled();
  });
});
