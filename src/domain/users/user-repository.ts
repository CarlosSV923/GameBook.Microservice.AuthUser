import { EmailAddress } from './email-address.js';
import { User } from './user.js';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: EmailAddress): Promise<User | null>;
  save(user: User): Promise<void>;
  replacePassword(
    id: string,
    passwordHash: string,
    expectedSessionVersion: number,
  ): Promise<boolean>;
}
