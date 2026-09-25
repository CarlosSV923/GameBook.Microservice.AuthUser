import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Patch,
  UnauthorizedException,
  Body,
} from '@nestjs/common';
import { CHANGE_PASSWORD_USE_CASE } from '../../application/ports/dependency-tokens.js';
import {
  ChangePasswordUseCase,
  ChangePasswordValidationError,
  InvalidCurrentPasswordError,
} from '../../application/use-cases/change-password.js';
import { SessionValidationError } from '../../application/use-cases/validate-session.js';
import { ChangeMyPasswordRequest } from './change-my-password.dto.js';

const BEARER_PATTERN = /^Bearer\s+(\S+)$/iu;

@Controller('v1/users/me')
export class ChangeMyPasswordController {
  constructor(
    @Inject(CHANGE_PASSWORD_USE_CASE)
    private readonly changePassword: ChangePasswordUseCase,
  ) {}

  @Patch('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async change(
    @Headers('authorization') authorization: string | undefined,
    @Body() request: ChangeMyPasswordRequest,
  ): Promise<void> {
    if (!authorization) {
      throw new UnauthorizedException({ code: 'TOKEN_MISSING' });
    }

    const match = BEARER_PATTERN.exec(authorization);
    if (!match) {
      throw new UnauthorizedException({ code: 'TOKEN_INVALID' });
    }

    try {
      await this.changePassword.execute({
        token: match[1],
        currentPassword: request.currentPassword,
        newPassword: request.newPassword,
      });
    } catch (error) {
      if (error instanceof SessionValidationError) {
        throw new UnauthorizedException({ code: error.code });
      }

      if (error instanceof InvalidCurrentPasswordError) {
        throw new UnauthorizedException({
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials.',
        });
      }

      if (error instanceof ChangePasswordValidationError) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          details: [{ field: error.field, reason: error.reason }],
        });
      }

      throw error;
    }
  }
}
