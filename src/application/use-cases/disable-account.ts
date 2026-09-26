import type { UserRepository } from '../../domain/users/user-repository.js';
import {
  SessionValidationError,
  type ValidateSessionUseCase,
} from './validate-session.js';

export class DisableAccountUseCase {
  constructor(
    private readonly validateSession: ValidateSessionUseCase,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(token: string): Promise<void> {
    const session = await this.validateSession.validate(token);
    const disabled = await this.userRepository.disable(
      session.user.id,
      session.claims.ver,
    );

    if (!disabled) {
      throw new SessionValidationError('SESSION_REVOKED');
    }
  }
}
