import {
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { VALIDATE_SESSION_USE_CASE } from '../../application/ports/dependency-tokens.js';
import {
  SessionValidationError,
  ValidateSessionUseCase,
} from '../../application/use-cases/validate-session.js';

const BEARER_PATTERN = /^Bearer\s+(\S+)$/iu;

@Controller('v1/auth')
export class GetCurrentSessionController {
  constructor(
    @Inject(VALIDATE_SESSION_USE_CASE)
    private readonly validateSession: ValidateSessionUseCase,
  ) {}

  @Get('session')
  @HttpCode(HttpStatus.OK)
  async getCurrentSession(@Headers('authorization') authorization?: string) {
    if (!authorization) {
      throw new UnauthorizedException({ code: 'TOKEN_MISSING' });
    }

    const match = BEARER_PATTERN.exec(authorization);
    if (!match) {
      throw new UnauthorizedException({ code: 'TOKEN_INVALID' });
    }

    try {
      return await this.validateSession.execute(match[1]);
    } catch (error) {
      if (error instanceof SessionValidationError) {
        throw new UnauthorizedException({ code: error.code });
      }

      throw error;
    }
  }
}
