import {
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  ErrorResponseModel,
  SessionResponseModel,
} from '../openapi/api-models.js';
import { VALIDATE_SESSION_USE_CASE } from '../../application/ports/dependency-tokens.js';
import {
  SessionValidationError,
  ValidateSessionUseCase,
} from '../../application/use-cases/validate-session.js';

const BEARER_PATTERN = /^Bearer\s+(\S+)$/iu;

@Controller('v1/auth')
@ApiTags('Authentication')
@ApiBearerAuth('BearerAuth')
export class GetCurrentSessionController {
  constructor(
    @Inject(VALIDATE_SESSION_USE_CASE)
    private readonly validateSession: ValidateSessionUseCase,
  ) {}

  @Get('session')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'getCurrentSession',
    summary: 'Get the current session',
    description:
      'Validates the Bearer JWT and the persisted session version. It does not issue or renew tokens.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current session is valid.',
    type: SessionResponseModel,
  })
  @ApiResponse({
    status: 401,
    description: 'Bearer token is missing, invalid, expired or revoked.',
    type: ErrorResponseModel,
  })
  @ApiResponse({
    status: 500,
    description: 'Unexpected server error.',
    type: ErrorResponseModel,
  })
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
