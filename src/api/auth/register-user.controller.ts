import {
  BadRequestException,
  ConflictException,
  Controller,
  Inject,
  Post,
  Body,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ErrorResponseModel,
  UserResponseModel,
} from '../openapi/api-models.js';
import { EmailAlreadyRegisteredError } from '../../domain/users/email-already-registered-error.js';
import { REGISTER_USER_USE_CASE } from '../../application/ports/dependency-tokens.js';
import {
  RegisterUserUseCase,
  RegistrationValidationError,
} from '../../application/use-cases/register-user.js';
import { RegisterUserRequest } from './register-user.dto.js';

@Controller('v1/auth')
@ApiTags('Authentication')
export class RegisterUserController {
  constructor(
    @Inject(REGISTER_USER_USE_CASE)
    private readonly registerUser: RegisterUserUseCase,
  ) {}

  @Post('register')
  @ApiOperation({
    operationId: 'registerUser',
    summary: 'Create an account',
    description:
      'Creates an account without starting a session. Passwords are never returned. Duplicate email addresses produce a conflict without revealing account details.',
  })
  @ApiBody({ type: RegisterUserRequest })
  @ApiResponse({
    status: 201,
    description: 'Account created.',
    type: UserResponseModel,
  })
  @ApiResponse({
    status: 400,
    description: 'Request validation failed.',
    type: ErrorResponseModel,
  })
  @ApiResponse({
    status: 409,
    description: 'The email address is already registered.',
    type: ErrorResponseModel,
  })
  @ApiResponse({
    status: 500,
    description: 'Unexpected server error.',
    type: ErrorResponseModel,
  })
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
