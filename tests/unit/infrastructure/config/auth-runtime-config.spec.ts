import { generateDevelopmentKeyPair } from '../../../../src/infrastructure/cryptography/rsa-jwt.js';
import { loadAuthRuntimeConfig } from '../../../../src/infrastructure/config/auth-runtime-config.js';

describe('loadAuthRuntimeConfig', () => {
  it('loads runtime values and restores escaped PEM newlines', () => {
    const { privateKey } = generateDevelopmentKeyPair();
    const environment = {
      AUTH_DATABASE_URL: 'postgresql://auth-app:secret@localhost:5432/gamebook',
      JWT_PRIVATE_KEY: privateKey.replace(/\n/g, '\\n'),
      JWT_ISSUER: 'authuser-local',
      JWT_AUDIENCE: 'gamebook-local',
    };

    expect(loadAuthRuntimeConfig(environment)).toEqual({
      databaseUrl: environment.AUTH_DATABASE_URL,
      jwtPrivateKey: privateKey.trim(),
      jwtIssuer: environment.JWT_ISSUER,
      jwtAudience: environment.JWT_AUDIENCE,
    });
  });

  it('fails closed when a required value is missing', () => {
    expect(() => loadAuthRuntimeConfig({})).toThrow('AUTH_DATABASE_URL');
  });

  it('rejects an invalid private key instead of deferring the failure', () => {
    expect(() =>
      loadAuthRuntimeConfig({
        AUTH_DATABASE_URL:
          'postgresql://auth-app:secret@localhost:5432/gamebook',
        JWT_PRIVATE_KEY: 'not-a-private-key',
        JWT_ISSUER: 'authuser-local',
        JWT_AUDIENCE: 'gamebook-local',
      }),
    ).toThrow();
  });
});
