import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CHANGE_PASSWORD_USE_CASE,
  DISABLE_ACCOUNT_USE_CASE,
  JWT_SIGNER,
  JWT_VERIFIER,
  LOGIN_USER_USE_CASE,
  PASSWORD_HASHER,
  REGISTER_USER_USE_CASE,
  USER_REPOSITORY,
  VALIDATE_SESSION_USE_CASE,
} from './application/ports/dependency-tokens.ts';
import type { AuthTokenSettings } from './application/ports/auth-token-settings.ts';
import type { JwtSigner, JwtVerifier } from './application/ports/jwt-ports.ts';
import type { PasswordHasher } from './application/ports/password-hasher.ts';
import type { UserRepository } from './domain/users/user-repository.ts';
import { ChangePasswordUseCase } from './application/use-cases/change-password.ts';
import { DisableAccountUseCase } from './application/use-cases/disable-account.ts';
import { LoginUserUseCase } from './application/use-cases/login-user.ts';
import { RegisterUserUseCase } from './application/use-cases/register-user.ts';
import { ValidateSessionUseCase } from './application/use-cases/validate-session.ts';
import { InfrastructureModule } from './infrastructure/infrastructure.module.ts';

const AUTH_TOKEN_SETTINGS = Symbol('AUTH_TOKEN_SETTINGS');

@Module({
  imports: [InfrastructureModule],
  providers: [
    {
      provide: AUTH_TOKEN_SETTINGS,
      useFactory: (config: ConfigService): AuthTokenSettings => ({
        issuer: config.getOrThrow<string>('JWT_ISSUER'),
        audience: config.getOrThrow<string>('JWT_AUDIENCE'),
      }),
      inject: [ConfigService],
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
        tokenSettings: AuthTokenSettings,
      ) =>
        new LoginUserUseCase(
          userRepository,
          passwordHasher,
          jwtSigner,
          tokenSettings.issuer,
          tokenSettings.audience,
        ),
      inject: [
        USER_REPOSITORY,
        PASSWORD_HASHER,
        JWT_SIGNER,
        AUTH_TOKEN_SETTINGS,
      ],
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
        passwordHasher: PasswordHasher,
        userRepository: UserRepository,
      ) => new ChangePasswordUseCase(passwordHasher, userRepository),
      inject: [PASSWORD_HASHER, USER_REPOSITORY],
    },
    {
      provide: DISABLE_ACCOUNT_USE_CASE,
      useFactory: (userRepository: UserRepository) =>
        new DisableAccountUseCase(userRepository),
      inject: [USER_REPOSITORY],
    },
  ],
  exports: [
    REGISTER_USER_USE_CASE,
    LOGIN_USER_USE_CASE,
    VALIDATE_SESSION_USE_CASE,
    CHANGE_PASSWORD_USE_CASE,
    DISABLE_ACCOUNT_USE_CASE,
  ],
})
export class ApplicationModule {}
