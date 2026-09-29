import {
  Controller,
  Delete,
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
import { ErrorResponseModel } from '../openapi/api-models.ts';
import { DISABLE_ACCOUNT_USE_CASE } from '../../application/ports/dependency-tokens.ts';
import { DisableAccountUseCase } from '../../application/use-cases/disable-account.ts';
import { SessionValidationError } from '../../application/use-cases/validate-session.ts';

const BEARER_PATTERN = /^Bearer\s+(\S+)$/iu;

@Controller('v1/users/me')
@ApiTags('User')
@ApiBearerAuth('BearerAuth')
export class DisableMyAccountController {
  constructor(
    @Inject(DISABLE_ACCOUNT_USE_CASE)
    private readonly disableAccount: DisableAccountUseCase,
  ) {}

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: 'disableMyAccount',
    summary: 'Disable the authenticated account',
    description:
      'Logically disables the account, preserves its data and immediately revokes every JWT previously issued for it.',
  })
  @ApiResponse({ status: 204, description: 'Account disabled.' })
  @ApiResponse({
    status: 401,
    description:
      'Bearer token is missing, invalid, expired, revoked or disabled.',
    type: ErrorResponseModel,
  })
  @ApiResponse({
    status: 500,
    description: 'Unexpected server error.',
    type: ErrorResponseModel,
  })
  async disable(
    @Headers('authorization') authorization?: string,
  ): Promise<void> {
    if (!authorization) {
      throw new UnauthorizedException({ code: 'TOKEN_MISSING' });
    }

    const match = BEARER_PATTERN.exec(authorization);
    if (!match) {
      throw new UnauthorizedException({ code: 'TOKEN_INVALID' });
    }

    try {
      await this.disableAccount.execute(match[1]);
    } catch (error) {
      if (error instanceof SessionValidationError) {
        throw new UnauthorizedException({ code: error.code });
      }

      throw error;
    }
  }
}
