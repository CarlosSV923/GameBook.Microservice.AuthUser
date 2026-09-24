import {
  BadRequestException,
  ConflictException,
  Controller,
  Inject,
  Post,
  Body,
} from '@nestjs/common';
import { EmailAlreadyRegisteredError } from '../../domain/users/email-already-registered-error.js';
import { REGISTER_USER_USE_CASE } from '../../application/ports/dependency-tokens.js';
import {
  RegisterUserUseCase,
  RegistrationValidationError,
} from '../../application/use-cases/register-user.js';
import { RegisterUserRequest } from './register-user.dto.js';

@Controller('v1/auth')
export class RegisterUserController {
  constructor(
    @Inject(REGISTER_USER_USE_CASE)
    private readonly registerUser: RegisterUserUseCase,
  ) {}

  @Post('register')
  async register(@Body() request: RegisterUserRequest) {
    try {
      return await this.registerUser.execute(request);
    } catch (error) {
      if (error instanceof RegistrationValidationError) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          details: [{ field: error.field, reason: error.reason }],
        });
      }

      if (error instanceof EmailAlreadyRegisteredError) {
        throw new ConflictException({
          code: 'EMAIL_ALREADY_REGISTERED',
        });
      }

      throw error;
    }
  }
}
