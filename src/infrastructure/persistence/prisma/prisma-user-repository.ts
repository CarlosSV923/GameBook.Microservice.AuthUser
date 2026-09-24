import type { UserRepository } from '../../../domain/users/user-repository.js';
import { User, type UserPersistence } from '../../../domain/users/user.js';
import type { EmailAddress } from '../../../domain/users/email-address.js';
import type { PrismaClient } from './generated/client.js';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { id } });
    return record ? toDomain(record) : null;
  }

  async findByEmail(email: EmailAddress): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { email: email.value },
    });
    return record ? toDomain(record) : null;
  }

  async save(user: User): Promise<void> {
    const persistence = user.toPersistence();
    await this.prisma.user.create({ data: persistence });
  }

  async replacePassword(
    id: string,
    passwordHash: string,
    expectedSessionVersion: number,
  ): Promise<boolean> {
    const result = await this.prisma.user.updateMany({
      where: { id, sessionVersion: expectedSessionVersion },
      data: {
        passwordHash,
        sessionVersion: { increment: 1 },
      },
    });

    return result.count === 1;
  }
}

function toDomain(record: UserPersistence): User {
  return User.rehydrate(record);
}
