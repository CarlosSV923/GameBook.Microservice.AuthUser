import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Patch,
  UnauthorizedException,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponseModel } from '../openapi/api-models.ts';
import { CHANGE_PASSWORD_USE_CASE } from '../../application/ports/dependency-tokens.ts';
import {
  ChangePasswordUseCase,
  ChangePasswordValidationError,
  InvalidCurrentPasswordError,
} from '../../application/use-cases/change-password.ts';
import { ChangeMyPasswordRequest } from './change-my-password.dto.ts';
import { BearerSessionGuard } from '../auth/bearer-session.guard.ts';
import {
  CurrentSession,
  type CurrentSessionIdentity,
} from '../auth/current-session.ts';

@Controller('v1/users/me')
@ApiTags('User')
@ApiBearerAuth('BearerAuth')
export class ChangeMyPasswordController {
  constructor(
    @Inject(CHANGE_PASSWORD_USE_CASE)
    private readonly changePassword: ChangePasswordUseCase,
  ) {}

  @Patch('password')
  @UseGuards(BearerSessionGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: 'changeMyPassword',
    summary: 'Change the authenticated account password',
    description:
      'Requires the current password and a new password that meets the MVP policy. The hash replacement increments sessionVersion atomically and immediately revokes all previously issued JWTs, including the token used for this request.',
  })
  @ApiBody({ type: ChangeMyPasswordRequest })
  @ApiResponse({
    status: 204,
    description: 'Password changed; no response body.',
  })
  @ApiResponse({
    status: 400,
    description: 'Request validation failed.',
    type: ErrorResponseModel,
  })
  @ApiResponse({
    status: 401,
    description:
      'Bearer token is missing, invalid, expired, revoked or the current password is incorrect.',
    type: ErrorResponseModel,
  })
  @ApiResponse({
    status: 500,
    description: 'Unexpected server error.',
    type: ErrorResponseModel,
  })
  async change(
    @CurrentSession() session: CurrentSessionIdentity,
    @Body() request: ChangeMyPasswordRequest,
  ): Promise<void> {
    try {
      await this.changePassword.execute({
        session,
        currentPassword: request.currentPassword,
        newPassword: request.newPassword,
      });
    } catch (error) {
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
