import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ApiExceptionFilter } from './api/http/api-exception.filter.js';
import { RequestIdMiddleware } from './api/http/request-id.js';
import { RequestLoggingMiddleware } from './api/http/request-logging.middleware.js';
import { createValidationPipe } from './api/http/validation-pipe.js';
import { PrismaService } from './infrastructure/persistence/prisma/prisma-service.js';
import { RegisterUserController } from './api/auth/register-user.controller.js';
import { LoginUserController } from './api/auth/login-user.controller.js';
import { GetCurrentSessionController } from './api/auth/get-current-session.controller.js';
import { ChangeMyPasswordController } from './api/users/change-my-password.controller.js';
import { ScryptPasswordHasher } from './infrastructure/cryptography/scrypt-password-hasher.js';
import { PrismaUserRepository } from './infrastructure/persistence/prisma/prisma-user-repository.js';
import {
  JWT_SIGNER,
  JWT_VERIFIER,
  LOGIN_USER_USE_CASE,
  PASSWORD_HASHER,
  REGISTER_USER_USE_CASE,
  USER_REPOSITORY,
  VALIDATE_SESSION_USE_CASE,
  CHANGE_PASSWORD_USE_CASE,
} from './application/ports/dependency-tokens.js';
import { RegisterUserUseCase } from './application/use-cases/register-user.js';
import { LoginUserUseCase } from './application/use-cases/login-user.js';
import { ValidateSessionUseCase } from './application/use-cases/validate-session.js';
import { ChangePasswordUseCase } from './application/use-cases/change-password.js';
import type { PasswordHasher } from './application/ports/password-hasher.js';
import type { JwtSigner, JwtVerifier } from './application/ports/jwt-ports.js';
import type { UserRepository } from './domain/users/user-repository.js';
import {
  derivePublicKey,
  RsaJwtSigner,
  RsaJwtVerifier,
} from './infrastructure/cryptography/rsa-jwt.js';
import { loadAuthRuntimeConfig } from './infrastructure/config/auth-runtime-config.js';

@Module({
  imports: [],
  controllers: [
    RegisterUserController,
    LoginUserController,
    GetCurrentSessionController,
    ChangeMyPasswordController,
  ],
  providers: [
    PrismaService,
    ScryptPasswordHasher,
    {
      provide: PASSWORD_HASHER,
      useExisting: ScryptPasswordHasher,
    },
    {
      provide: JWT_SIGNER,
      useFactory: (): JwtSigner =>
        new RsaJwtSigner(loadAuthRuntimeConfig().jwtPrivateKey),
    },
    {
      provide: JWT_VERIFIER,
      useFactory: (): JwtVerifier => {
        const configuration = loadAuthRuntimeConfig();
        return new RsaJwtVerifier(
          derivePublicKey(configuration.jwtPrivateKey),
          configuration.jwtIssuer,
          configuration.jwtAudience,
        );
      },
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
    {
      provide: LOGIN_USER_USE_CASE,
      useFactory: (
        userRepository: UserRepository,
        passwordHasher: PasswordHasher,
        jwtSigner: JwtSigner,
      ) => {
        const configuration = loadAuthRuntimeConfig();
        return new LoginUserUseCase(
          userRepository,
          passwordHasher,
          jwtSigner,
          configuration.jwtIssuer,
          configuration.jwtAudience,
        );
      },
      inject: [USER_REPOSITORY, PASSWORD_HASHER, JWT_SIGNER],
    },
    {
      provide: VALIDATE_SESSION_USE_CASE,
      useFactory: (jwtVerifier: JwtVerifier, userRepository: UserRepository) =>
        new ValidateSessionUseCase(jwtVerifier, userRepository),
      inject: [JWT_VERIFIER, USER_REPOSITORY],
    },
    {
      provide: CHANGE_PASSWORD_USE_CASE,
      useFactory: (
        validateSession: ValidateSessionUseCase,
        passwordHasher: PasswordHasher,
        userRepository: UserRepository,
      ) =>
        new ChangePasswordUseCase(
          validateSession,
          passwordHasher,
          userRepository,
        ),
      inject: [VALIDATE_SESSION_USE_CASE, PASSWORD_HASHER, USER_REPOSITORY],
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
