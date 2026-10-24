import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { Request } from 'express';
import { VALIDATE_SESSION_USE_CASE } from '../../application/ports/dependency-tokens.ts';
import {
  SessionValidationError,
  type ValidateSessionUseCase,
} from '../../application/use-cases/validate-session.ts';
import type { CurrentSessionIdentity } from './current-session.ts';

const BEARER_PATTERN = /^Bearer\s+(\S+)$/iu;

interface AuthenticatedRequest extends Request {
  currentSession?: CurrentSessionIdentity;
}

@Injectable()
export class BearerSessionGuard implements CanActivate {
  constructor(
    @Inject(VALIDATE_SESSION_USE_CASE)
    private readonly validateSession: ValidateSessionUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    if (!authorization) {
      throw new UnauthorizedException({ code: 'TOKEN_MISSING' });
    }

    const match = BEARER_PATTERN.exec(authorization);
    if (!match) {
      throw new UnauthorizedException({ code: 'TOKEN_INVALID' });
    }

    try {
      const session = await this.validateSession.validate(match[1]);
      request.currentSession = {
        userId: session.claims.sub,
        sessionVersion: session.claims.ver,
        fullName: session.user.fullName,
        email: session.user.email,
      };
      return true;
    } catch (error) {
      if (error instanceof SessionValidationError) {
        throw new UnauthorizedException({ code: error.code });
      }
      throw error;
    }
  }
}
