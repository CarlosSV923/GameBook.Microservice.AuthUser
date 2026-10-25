import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
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
} from '../openapi/api-models.ts';
import { BearerSessionGuard } from './bearer-session.guard.ts';
import {
  CurrentSession,
  type CurrentSessionIdentity,
} from './current-session.ts';

@Controller('v1/auth')
@ApiTags('Authentication')
@ApiBearerAuth('BearerAuth')
export class GetCurrentSessionController {
  @Get('session')
  @UseGuards(BearerSessionGuard)
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
    description:
      'Bearer token is missing, invalid, expired, revoked or belongs to a disabled account.',
    type: ErrorResponseModel,
  })
  @ApiResponse({
    status: 500,
    description: 'Unexpected server error.',
    type: ErrorResponseModel,
  })
  async getCurrentSession(@CurrentSession() session: CurrentSessionIdentity) {
    return {
      user: {
        id: session.userId,
        fullName: session.fullName,
        email: session.email,
      },
    };
  }
}
