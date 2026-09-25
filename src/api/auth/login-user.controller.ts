import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ErrorResponseModel,
  LoginResponseModel,
} from '../openapi/api-models.js';
import { LOGIN_USER_USE_CASE } from '../../application/ports/dependency-tokens.js';
import {
  InvalidCredentialsError,
  LoginUserUseCase,
} from '../../application/use-cases/login-user.js';
import { LoginUserRequest } from './login-user.dto.js';

@Controller('v1/auth')
@ApiTags('Authentication')
export class LoginUserController {
  constructor(
    @Inject(LOGIN_USER_USE_CASE)
    private readonly loginUser: LoginUserUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'loginUser',
    summary: 'Sign in',
    description:
      'Validates credentials and returns a one-hour JWT. Invalid-credential errors stay generic so account existence is not revealed.',
  })
  @ApiBody({ type: LoginUserRequest })
  @ApiResponse({
    status: 200,
    description: 'Credentials accepted and token issued.',
    type: LoginResponseModel,
  })
  @ApiResponse({
    status: 400,
    description: 'Request validation failed.',
    type: ErrorResponseModel,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials.',
    type: ErrorResponseModel,
  })
  @ApiResponse({
    status: 500,
    description: 'Unexpected server error.',
    type: ErrorResponseModel,
  })
  async login(@Body() request: LoginUserRequest) {
    try {
      return await this.loginUser.execute(request);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS' });
      }

      throw error;
    }
  }
}
