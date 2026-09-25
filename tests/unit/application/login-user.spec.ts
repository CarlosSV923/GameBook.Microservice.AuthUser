import { EmailAddress } from '../../../src/domain/users/email-address.js';
import type { JwtSigner } from '../../../src/application/ports/jwt-ports.js';
import type { PasswordHasher } from '../../../src/application/ports/password-hasher.js';
import type { UserRepository } from '../../../src/domain/users/user-repository.js';
import {
  InvalidCredentialsError,
  LoginUserUseCase,
} from '../../../src/application/use-cases/login-user.js';

describe('LoginUserUseCase', () => {
  const userRepository = {
    findByEmail: vi.fn(),
  } as unknown as UserRepository;
  const passwordHasher = {
    hash: vi.fn(),
    verify: vi.fn(),
  } as unknown as PasswordHasher;
  const jwtSigner = {
    sign: vi.fn(),
  } as unknown as JwtSigner;
  const useCase = new LoginUserUseCase(
    userRepository,
    passwordHasher,
    jwtSigner,
    'gamebook-auth',
    'gamebook-services',
    () => 1_700_000_000,
  );
  const user = {
    id: '7b7f3d2e-6d8d-4e8c-9e0c-2a96f2fb11aa',
    fullName: 'Ada Lovelace',
    email: 'ada@example.com',
    passwordHash: 'scrypt$fixture',
    sessionVersion: 3,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    userRepository.findByEmail = vi.fn().mockResolvedValue(user);
    passwordHasher.verify = vi.fn().mockResolvedValue(true);
    jwtSigner.sign = vi.fn().mockResolvedValue('signed.jwt.token');
  });

  it('verifies the hash, signs the agreed claims and returns the contract response', async () => {
    const result = await useCase.execute({
      email: ' ADA@EXAMPLE.COM ',
      password: 'GameBook@2026',
    });

    expect(userRepository.findByEmail).toHaveBeenCalledWith(
      EmailAddress.create('ada@example.com'),
    );
    expect(passwordHasher.verify).toHaveBeenCalledWith(
      'GameBook@2026',
      'scrypt$fixture',
    );
    expect(jwtSigner.sign).toHaveBeenCalledWith({
      sub: user.id,
      ver: 3,
      iat: 1_700_000_000,
      exp: 1_700_003_600,
      iss: 'gamebook-auth',
      aud: 'gamebook-services',
    });
    expect(result).toEqual({
      accessToken: 'signed.jwt.token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
    });
    expect(result).not.toHaveProperty('password');
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('uses the same generic error for an unknown email', async () => {
    userRepository.findByEmail = vi.fn().mockResolvedValue(null);
    passwordHasher.verify = vi.fn().mockResolvedValue(false);

    await expect(
      useCase.execute({ email: 'unknown@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(passwordHasher.verify).toHaveBeenCalledWith('wrong', '');
    expect(jwtSigner.sign).not.toHaveBeenCalled();
  });

  it('uses the same generic error for a wrong password', async () => {
    passwordHasher.verify = vi.fn().mockResolvedValue(false);

    await expect(
      useCase.execute({ email: 'ada@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(jwtSigner.sign).not.toHaveBeenCalled();
  });

  it('does not expose malformed emails as a different credential error', async () => {
    await expect(
      useCase.execute({ email: 'not-an-email', password: 'wrong' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(userRepository.findByEmail).not.toHaveBeenCalled();
    expect(passwordHasher.verify).not.toHaveBeenCalled();
  });
});
