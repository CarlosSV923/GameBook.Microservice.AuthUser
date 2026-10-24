import { EmailAddress } from './email-address.ts';
import { User } from './user.ts';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: EmailAddress): Promise<User | null>;
  create(user: User): Promise<void>;
  save(user: User, expectedSessionVersion: number): Promise<boolean>;
}
