import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  JWT_SIGNER,
  JWT_VERIFIER,
  PASSWORD_HASHER,
  USER_REPOSITORY,
} from '../application/ports/dependency-tokens.js';
import type { JwtSigner, JwtVerifier } from '../application/ports/jwt-ports.js';
import type { UserRepository } from '../domain/users/user-repository.js';
import {
  derivePublicKey,
  RsaJwtSigner,
  RsaJwtVerifier,
} from './cryptography/rsa-jwt.js';
import { ScryptPasswordHasher } from './cryptography/scrypt-password-hasher.js';
import { PrismaService } from './persistence/prisma/prisma-service.js';
import { PrismaUserRepository } from './persistence/prisma/prisma-user-repository.js';

@Module({
  providers: [
    PrismaService,
    ScryptPasswordHasher,
    {
      provide: PASSWORD_HASHER,
      useExisting: ScryptPasswordHasher,
    },
    {
      provide: JWT_SIGNER,
      useFactory: (config: ConfigService): JwtSigner =>
        new RsaJwtSigner(config.getOrThrow<string>('JWT_PRIVATE_KEY')),
      inject: [ConfigService],
    },
    {
      provide: JWT_VERIFIER,
      useFactory: (config: ConfigService): JwtVerifier => {
        const privateKey = config.getOrThrow<string>('JWT_PRIVATE_KEY');
        return new RsaJwtVerifier(
          derivePublicKey(privateKey),
          config.getOrThrow<string>('JWT_ISSUER'),
          config.getOrThrow<string>('JWT_AUDIENCE'),
        );
      },
      inject: [ConfigService],
    },
    {
      provide: USER_REPOSITORY,
      useFactory: (prisma: PrismaService): UserRepository =>
        new PrismaUserRepository(prisma.client),
      inject: [PrismaService],
    },
  ],
  exports: [PASSWORD_HASHER, JWT_SIGNER, JWT_VERIFIER, USER_REPOSITORY],
})
export class InfrastructureModule {}
