import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CHANGE_PASSWORD_USE_CASE,
  JWT_SIGNER,
  JWT_VERIFIER,
  LOGIN_USER_USE_CASE,
  PASSWORD_HASHER,
  REGISTER_USER_USE_CASE,
  USER_REPOSITORY,
  VALIDATE_SESSION_USE_CASE,
} from './ports/dependency-tokens.js';
import type { JwtSigner, JwtVerifier } from './ports/jwt-ports.js';
import type { PasswordHasher } from './ports/password-hasher.js';
import type { UserRepository } from '../domain/users/user-repository.js';
import { ChangePasswordUseCase } from './use-cases/change-password.js';
import { LoginUserUseCase } from './use-cases/login-user.js';
import { RegisterUserUseCase } from './use-cases/register-user.js';
import { ValidateSessionUseCase } from './use-cases/validate-session.js';
import { InfrastructureModule } from '../infrastructure/infrastructure.module.js';

@Module({
  imports: [InfrastructureModule],
  providers: [
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
        config: ConfigService,
      ) =>
        new LoginUserUseCase(
          userRepository,
          passwordHasher,
          jwtSigner,
          config.getOrThrow<string>('JWT_ISSUER'),
          config.getOrThrow<string>('JWT_AUDIENCE'),
        ),
      inject: [USER_REPOSITORY, PASSWORD_HASHER, JWT_SIGNER, ConfigService],
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
  ],
  exports: [
    REGISTER_USER_USE_CASE,
    LOGIN_USER_USE_CASE,
    VALIDATE_SESSION_USE_CASE,
    CHANGE_PASSWORD_USE_CASE,
  ],
})
export class ApplicationModule {}
