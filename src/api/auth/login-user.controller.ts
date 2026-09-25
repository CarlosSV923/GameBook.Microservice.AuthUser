import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { LOGIN_USER_USE_CASE } from '../../application/ports/dependency-tokens.js';
import {
  InvalidCredentialsError,
  LoginUserUseCase,
} from '../../application/use-cases/login-user.js';
import { LoginUserRequest } from './login-user.dto.js';

@Controller('v1/auth')
export class LoginUserController {
  constructor(
    @Inject(LOGIN_USER_USE_CASE)
    private readonly loginUser: LoginUserUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
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
