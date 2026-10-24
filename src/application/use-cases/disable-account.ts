import type { UserRepository } from '../../domain/users/user-repository.ts';
import {
  SessionValidationError,
  type ValidateSessionUseCase,
} from './validate-session.ts';

export class DisableAccountUseCase {
  constructor(
    private readonly validateSession: ValidateSessionUseCase,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(token: string): Promise<void> {
    const session = await this.validateSession.validate(token);
    const expectedSessionVersion = session.user.sessionVersion;
    session.user.disable();
    const saved = await this.userRepository.save(
      session.user,
      expectedSessionVersion,
    );

    if (!saved) {
      throw new SessionValidationError('SESSION_REVOKED');
    }
  }
}
