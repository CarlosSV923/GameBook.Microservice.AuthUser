import {
  type JwtClaims,
  JwtExpiredError,
  type JwtVerifier,
} from '../ports/jwt-ports.js';
import type { UserRepository } from '../../domain/users/user-repository.js';
import type { User } from '../../domain/users/user.js';

export type SessionValidationErrorCode =
  'TOKEN_INVALID' | 'TOKEN_EXPIRED' | 'SESSION_REVOKED';

export interface ValidateSessionOutput {
  readonly user: {
    readonly id: string;
    readonly fullName: string;
    readonly email: string;
  };
}

export interface AuthenticatedSession {
  readonly user: User;
  readonly claims: JwtClaims;
}

export class SessionValidationError extends Error {
  constructor(public readonly code: SessionValidationErrorCode) {
    super(code);
    this.name = 'SessionValidationError';
  }
}

export class ValidateSessionUseCase {
  constructor(
    private readonly jwtVerifier: JwtVerifier,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(token: string): Promise<ValidateSessionOutput> {
    const { user } = await this.validate(token);

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
    };
  }

  async validate(token: string): Promise<AuthenticatedSession> {
    let claims: JwtClaims;
    try {
      claims = await this.jwtVerifier.verify(token);
    } catch (error) {
      if (error instanceof JwtExpiredError) {
        throw new SessionValidationError('TOKEN_EXPIRED');
      }

      throw new SessionValidationError('TOKEN_INVALID');
    }

    const user = await this.userRepository.findById(claims.sub);
    if (!user || user.sessionVersion !== claims.ver) {
      throw new SessionValidationError('SESSION_REVOKED');
    }

    return {
      user,
      claims,
    };
  }
}
