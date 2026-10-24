import type { PrismaClient } from '../../../../src/infrastructure/persistence/prisma/generated/client.ts';
import { EmailAddress } from '../../../../src/domain/users/email-address.ts';
import { EmailAlreadyRegisteredError } from '../../../../src/domain/users/email-already-registered-error.ts';
import { User } from '../../../../src/domain/users/user.ts';
import { PrismaUserRepository } from '../../../../src/infrastructure/persistence/prisma/prisma-user-repository.ts';

describe('PrismaUserRepository', () => {
  const userDelegate = {
    findUnique: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  };
  const prisma = { user: userDelegate } as unknown as PrismaClient;
  const repository = new PrismaUserRepository(prisma);
  let user = createUser();

  beforeEach(() => {
    vi.clearAllMocks();
    user = createUser();
  });

  it('maps a persisted user by id and normalizes it through the domain', async () => {
    userDelegate.findUnique.mockResolvedValue(user.toPersistence());

    await expect(repository.findById(user.id)).resolves.toEqual(user);
    expect(userDelegate.findUnique).toHaveBeenCalledWith({
      where: { id: user.id },
    });
  });

  it('finds a user by the normalized email value', async () => {
    userDelegate.findUnique.mockResolvedValue(user.toPersistence());
    const email = EmailAddress.create(' ADA@EXAMPLE.COM ');

    await expect(repository.findByEmail(email)).resolves.toEqual(user);
    expect(userDelegate.findUnique).toHaveBeenCalledWith({
      where: { email: 'ada@example.com' },
    });
  });

  it('creates new users and saves the aggregate state by expected version', async () => {
    userDelegate.create.mockResolvedValue(user.toPersistence());
    userDelegate.updateMany.mockResolvedValue({ count: 1 });

    const created = user.toPersistence();
    await repository.create(user);
    user.changePassword('scrypt$new');
    await expect(repository.save(user, 1)).resolves.toBe(true);

    expect(userDelegate.create).toHaveBeenCalledWith({ data: created });
    expect(userDelegate.updateMany).toHaveBeenCalledWith({
      where: { id: user.id, sessionVersion: 1 },
      data: {
        fullName: user.fullName,
        email: user.email,
        passwordHash: 'scrypt$new',
        sessionVersion: 2,
        isDisabled: false,
      },
    });
  });

  it('saves a disabled aggregate by expected session version', async () => {
    userDelegate.updateMany.mockResolvedValue({ count: 1 });
    user.disable();

    await expect(repository.save(user, 1)).resolves.toBe(true);

    expect(userDelegate.updateMany).toHaveBeenCalledWith({
      where: { id: user.id, sessionVersion: 1 },
      data: {
        fullName: user.fullName,
        email: user.email,
        passwordHash: user.passwordHash,
        sessionVersion: 2,
        isDisabled: true,
      },
    });
  });

  it('reports an optimistic concurrency conflict without changing the aggregate', async () => {
    const changedUser = User.rehydrate({
      ...user.toPersistence(),
      sessionVersion: 2,
    });
    changedUser.changePassword('scrypt$new');
    userDelegate.updateMany.mockResolvedValue({ count: 0 });

    await expect(repository.save(changedUser, 1)).resolves.toBe(false);
    expect(userDelegate.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: user.id, sessionVersion: 1 } }),
    );
  });

  it('maps a database unique constraint to the public duplicate error', async () => {
    userDelegate.create.mockRejectedValue({ code: 'P2002' });

    await expect(repository.create(user)).rejects.toBeInstanceOf(
      EmailAlreadyRegisteredError,
    );
  });

  function createUser(): User {
    return User.create({
      id: '7b7f3d2e-6d8d-4e8c-9e0c-2a96f2fb11aa',
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      passwordHash: 'scrypt$fixture',
    });
  }
});
