import type { UserRepository } from '../../domain/users/user-repository.ts';
import type { AuthenticatedIdentity } from '../authenticated-identity.ts';
import { SessionValidationError } from './validate-session.ts';

export class DisableAccountUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(identity: AuthenticatedIdentity): Promise<void> {
    const user = await this.userRepository.findById(identity.userId);
    if (
      !user ||
      user.isDisabled ||
      user.sessionVersion !== identity.sessionVersion
    ) {
      throw new SessionValidationError(
        user?.isDisabled ? 'ACCOUNT_DISABLED' : 'SESSION_REVOKED',
      );
    }
    const expectedSessionVersion = identity.sessionVersion;
    user.disable();
    const saved = await this.userRepository.save(user, expectedSessionVersion);

    if (!saved) {
      throw new SessionValidationError('SESSION_REVOKED');
    }
  }
}
