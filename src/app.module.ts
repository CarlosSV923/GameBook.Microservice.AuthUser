import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ApiExceptionFilter } from './api/http/api-exception.filter.js';
import { RequestIdMiddleware } from './api/http/request-id.js';
import { RequestLoggingMiddleware } from './api/http/request-logging.middleware.js';
import { createValidationPipe } from './api/http/validation-pipe.js';
import { PrismaService } from './infrastructure/persistence/prisma/prisma-service.js';
import { RegisterUserController } from './api/auth/register-user.controller.js';
import { ScryptPasswordHasher } from './infrastructure/cryptography/scrypt-password-hasher.js';
import { PrismaUserRepository } from './infrastructure/persistence/prisma/prisma-user-repository.js';
import {
  PASSWORD_HASHER,
  REGISTER_USER_USE_CASE,
  USER_REPOSITORY,
} from './application/ports/dependency-tokens.js';
import { RegisterUserUseCase } from './application/use-cases/register-user.js';
import type { PasswordHasher } from './application/ports/password-hasher.js';
import type { UserRepository } from './domain/users/user-repository.js';

@Module({
  imports: [],
  controllers: [AppController, RegisterUserController],
  providers: [
    AppService,
    PrismaService,
    ScryptPasswordHasher,
    {
      provide: PASSWORD_HASHER,
      useExisting: ScryptPasswordHasher,
    },
    {
      provide: USER_REPOSITORY,
      useFactory: (prisma: PrismaService): UserRepository =>
        new PrismaUserRepository(prisma.client),
      inject: [PrismaService],
    },
    {
      provide: REGISTER_USER_USE_CASE,
      useFactory: (
        userRepository: UserRepository,
        passwordHasher: PasswordHasher,
      ) => new RegisterUserUseCase(userRepository, passwordHasher),
      inject: [USER_REPOSITORY, PASSWORD_HASHER],
    },
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    { provide: APP_PIPE, useFactory: createValidationPipe },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestIdMiddleware, RequestLoggingMiddleware)
      .forRoutes('*');
  }
}
