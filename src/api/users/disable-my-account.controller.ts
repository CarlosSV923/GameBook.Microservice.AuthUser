import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
  UseGuards,
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
import { BearerSessionGuard } from '../auth/bearer-session.guard.ts';
import {
  CurrentSession,
  type CurrentSessionIdentity,
} from '../auth/current-session.ts';

@Controller('v1/users/me')
@ApiTags('User')
@ApiBearerAuth('BearerAuth')
export class DisableMyAccountController {
  constructor(
    @Inject(DISABLE_ACCOUNT_USE_CASE)
    private readonly disableAccount: DisableAccountUseCase,
  ) {}

  @Delete()
  @UseGuards(BearerSessionGuard)
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
    @CurrentSession() session: CurrentSessionIdentity,
  ): Promise<void> {
    await this.disableAccount.execute(session);
  }
}
