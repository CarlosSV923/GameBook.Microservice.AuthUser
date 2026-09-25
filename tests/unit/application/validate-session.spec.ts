import {
  JwtExpiredError,
  JwtVerificationError,
  type JwtClaims,
  type JwtVerifier,
} from '../../../src/application/ports/jwt-ports.js';
import {
  SessionValidationError,
  ValidateSessionUseCase,
} from '../../../src/application/use-cases/validate-session.js';
import type { UserRepository } from '../../../src/domain/users/user-repository.js';
import { User } from '../../../src/domain/users/user.js';

describe('ValidateSessionUseCase', () => {
  const jwtVerifier = {
    verify: vi.fn(),
  } as unknown as JwtVerifier;
  const userRepository = {
    findById: vi.fn(),
  } as unknown as UserRepository;
  const useCase = new ValidateSessionUseCase(jwtVerifier, userRepository);
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

  beforeEach(() => {
    vi.clearAllMocks();
    jwtVerifier.verify = vi.fn().mockResolvedValue(claims);
    userRepository.findById = vi.fn().mockResolvedValue(user);
  });

  it('verifies the token, checks the persisted version and returns public identity', async () => {
    await expect(useCase.execute('signed.jwt.token')).resolves.toEqual({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
    });
    expect(jwtVerifier.verify).toHaveBeenCalledWith('signed.jwt.token');
    expect(userRepository.findById).toHaveBeenCalledWith(claims.sub);
  });

  it('maps malformed or tampered tokens to TOKEN_INVALID', async () => {
    jwtVerifier.verify = vi.fn().mockRejectedValue(new JwtVerificationError());

    await expect(useCase.execute('invalid.jwt.token')).rejects.toEqual(
      expect.objectContaining({ code: 'TOKEN_INVALID' }),
    );
    expect(userRepository.findById).not.toHaveBeenCalled();
  });

  it('maps an expired token to TOKEN_EXPIRED', async () => {
    jwtVerifier.verify = vi.fn().mockRejectedValue(new JwtExpiredError());

    await expect(useCase.execute('expired.jwt.token')).rejects.toEqual(
      expect.objectContaining({ code: 'TOKEN_EXPIRED' }),
    );
    expect(userRepository.findById).not.toHaveBeenCalled();
  });

  it('maps a missing user or a mismatched version to SESSION_REVOKED', async () => {
    userRepository.findById = vi.fn().mockResolvedValue(null);

    await expect(useCase.execute('signed.jwt.token')).rejects.toBeInstanceOf(
      SessionValidationError,
    );
    await expect(useCase.execute('signed.jwt.token')).rejects.toEqual(
      expect.objectContaining({ code: 'SESSION_REVOKED' }),
    );

    userRepository.findById = vi.fn().mockResolvedValue(
      User.rehydrate({
        ...user.toPersistence(),
        sessionVersion: claims.ver + 1,
      }),
    );
    await expect(useCase.execute('signed.jwt.token')).rejects.toEqual(
      expect.objectContaining({ code: 'SESSION_REVOKED' }),
    );
  });
});
