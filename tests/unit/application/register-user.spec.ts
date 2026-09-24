import { EmailAddress } from '../../../src/domain/users/email-address.js';
import { EmailAlreadyRegisteredError } from '../../../src/domain/users/email-already-registered-error.js';
import type { UserRepository } from '../../../src/domain/users/user-repository.js';
import { RegisterUserUseCase } from '../../../src/application/use-cases/register-user.js';
import type { PasswordHasher } from '../../../src/application/ports/password-hasher.js';

describe('RegisterUserUseCase', () => {
  const userRepository = {
    findByEmail: vi.fn(),
    save: vi.fn(),
  } as unknown as UserRepository;
  const passwordHasher = {
    hash: vi.fn(),
    verify: vi.fn(),
  } as unknown as PasswordHasher;
  const useCase = new RegisterUserUseCase(userRepository, passwordHasher);
  const input = {
    fullName: ' Ada Lovelace ',
    email: ' ADA@EXAMPLE.COM ',
    password: 'GameBook@2026',
    passwordConfirmation: 'GameBook@2026',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    userRepository.findByEmail = vi.fn().mockResolvedValue(null);
    userRepository.save = vi.fn().mockResolvedValue(undefined);
    passwordHasher.hash = vi.fn().mockResolvedValue('scrypt$fixture');
  });

  it('creates a user with normalized identity and never returns credentials', async () => {
    const result = await useCase.execute(input);

    expect(result.user).toEqual({
      id: expect.any(String),
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
    });
    expect(passwordHasher.hash).toHaveBeenCalledWith('GameBook@2026');
    expect(userRepository.findByEmail).toHaveBeenCalledWith(
      EmailAddress.create('ada@example.com'),
    );
    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Ada Lovelace',
        email: 'ada@example.com',
        passwordHash: 'scrypt$fixture',
        sessionVersion: 1,
      }),
    );
    expect(result.user).not.toHaveProperty('password');
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('rejects a normalized email that already exists', async () => {
    userRepository.findByEmail = vi.fn().mockResolvedValue({});

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      EmailAlreadyRegisteredError,
    );
    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('rejects mismatched password confirmation before hashing', async () => {
    await expect(
      useCase.execute({ ...input, passwordConfirmation: 'Other@2026' }),
    ).rejects.toEqual(
      expect.objectContaining({
        field: 'passwordConfirmation',
        reason: 'PASSWORD_CONFIRMATION_MISMATCH',
      }),
    );
    expect(passwordHasher.hash).not.toHaveBeenCalled();
  });

  it('rejects passwords that do not meet the product policy', async () => {
    await expect(
      useCase.execute({
        ...input,
        password: 'password',
        passwordConfirmation: 'password',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        field: 'password',
        reason: 'PASSWORD_POLICY_NOT_MET',
      }),
    );
    expect(passwordHasher.hash).not.toHaveBeenCalled();
  });

  it('preserves a duplicate error raised by the unique constraint race', async () => {
    userRepository.save = vi
      .fn()
      .mockRejectedValue(new EmailAlreadyRegisteredError());

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      EmailAlreadyRegisteredError,
    );
  });

  it('reports an invalid email as a registration validation error', async () => {
    await expect(
      useCase.execute({ ...input, email: 'invalid-email' }),
    ).rejects.toEqual(
      expect.objectContaining({ field: 'email', reason: 'EMAIL_INVALID' }),
    );
  });
});
