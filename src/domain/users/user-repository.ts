import { EmailAddress } from './email-address.ts';
import { User } from './user.ts';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: EmailAddress): Promise<User | null>;
  save(user: User): Promise<void>;
  replacePassword(
    id: string,
    passwordHash: string,
    expectedSessionVersion: number,
  ): Promise<boolean>;
  disable(id: string, expectedSessionVersion: number): Promise<boolean>;
}
