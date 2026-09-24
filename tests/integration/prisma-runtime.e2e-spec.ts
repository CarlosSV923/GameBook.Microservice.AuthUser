import { createPrismaClient } from '../../src/infrastructure/persistence/prisma/prisma-client.js';
import { loadAuthRuntimeConfig } from '../../src/infrastructure/config/auth-runtime-config.js';
import { generateDevelopmentKeyPair } from '../../src/infrastructure/cryptography/rsa-jwt.js';

describe('AuthUser Prisma runtime base', () => {
  it('validates runtime configuration and creates a Prisma client without migration credentials', async () => {
    const keyPair = generateDevelopmentKeyPair();
    const configuration = loadAuthRuntimeConfig({
      AUTH_DATABASE_URL:
        'postgresql://runtime_user:runtime_password@localhost:5432/gamebook?schema=auth',
      JWT_PRIVATE_KEY: keyPair.privateKey,
      JWT_ISSUER: 'gamebook-authuser-test',
      JWT_AUDIENCE: 'gamebook-test',
    });
    const client = createPrismaClient(configuration.databaseUrl);

    expect(configuration.databaseUrl).toContain('schema=auth');
    expect(client).toBeDefined();

    await client.$disconnect();
  });

  it('fails closed when the runtime database URL is absent', () => {
    const keyPair = generateDevelopmentKeyPair();

    expect(() =>
      loadAuthRuntimeConfig({
        JWT_PRIVATE_KEY: keyPair.privateKey,
        JWT_ISSUER: 'gamebook-authuser-test',
        JWT_AUDIENCE: 'gamebook-test',
      }),
    ).toThrow('AUTH_DATABASE_URL');
  });
});
