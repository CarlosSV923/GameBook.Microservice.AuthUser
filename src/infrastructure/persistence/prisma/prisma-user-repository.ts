import type { UserRepository } from '../../../domain/users/user-repository.ts';
import { EmailAlreadyRegisteredError } from '../../../domain/users/email-already-registered-error.ts';
import { User, type UserPersistence } from '../../../domain/users/user.ts';
import type { EmailAddress } from '../../../domain/users/email-address.ts';
import type { PrismaClient } from './generated/client.ts';

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

  async create(user: User): Promise<void> {
    const persistence = user.toPersistence();

    try {
      await this.prisma.user.create({ data: persistence });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new EmailAlreadyRegisteredError();
      }

      throw error;
    }
  }

  async save(user: User, expectedSessionVersion: number): Promise<boolean> {
    const persistence = user.toPersistence();
    const result = await this.prisma.user.updateMany({
      where: {
        id: user.id,
        sessionVersion: expectedSessionVersion,
      },
      data: {
        fullName: persistence.fullName,
        email: persistence.email,
        passwordHash: persistence.passwordHash,
        sessionVersion: persistence.sessionVersion,
        isDisabled: persistence.isDisabled,
      },
    });

    return result.count === 1;
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}

function toDomain(record: UserPersistence): User {
  return User.rehydrate(record);
}
