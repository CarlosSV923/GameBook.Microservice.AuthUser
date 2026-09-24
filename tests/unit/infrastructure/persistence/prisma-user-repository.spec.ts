import type { PrismaClient } from '../../../../src/infrastructure/persistence/prisma/generated/client.js';
import { EmailAddress } from '../../../../src/domain/users/email-address.js';
import { User } from '../../../../src/domain/users/user.js';
import { PrismaUserRepository } from '../../../../src/infrastructure/persistence/prisma/prisma-user-repository.js';

describe('PrismaUserRepository', () => {
  const userDelegate = {
    findUnique: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  };
  const prisma = { user: userDelegate } as unknown as PrismaClient;
  const repository = new PrismaUserRepository(prisma);
  const user = User.create({
    id: '7b7f3d2e-6d8d-4e8c-9e0c-2a96f2fb11aa',
    fullName: 'Ada Lovelace',
    email: 'ada@example.com',
    passwordHash: 'scrypt$fixture',
  });

  beforeEach(() => vi.clearAllMocks());

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

  it('persists new users and atomically replaces a password by version', async () => {
    userDelegate.create.mockResolvedValue(user.toPersistence());
    userDelegate.updateMany.mockResolvedValue({ count: 1 });

    await repository.save(user);
    await expect(
      repository.replacePassword(user.id, 'scrypt$new', user.sessionVersion),
    ).resolves.toBe(true);

    expect(userDelegate.create).toHaveBeenCalledWith({
      data: user.toPersistence(),
    });
    expect(userDelegate.updateMany).toHaveBeenCalledWith({
      where: { id: user.id, sessionVersion: 1 },
      data: { passwordHash: 'scrypt$new', sessionVersion: { increment: 1 } },
    });
  });

  it('reports a failed compare-and-update when the session version changed', async () => {
    userDelegate.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      repository.replacePassword(user.id, 'scrypt$new', user.sessionVersion),
    ).resolves.toBe(false);
  });
});
