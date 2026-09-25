import { generateDevelopmentKeyPair } from '../../../../src/infrastructure/cryptography/rsa-jwt.js';
import { validateAuthConfiguration } from '../../../../src/infrastructure/config/auth-runtime-config.js';

describe('validateAuthConfiguration', () => {
  it('loads runtime values and restores escaped PEM newlines', () => {
    const { privateKey } = generateDevelopmentKeyPair();
    const environment = {
      AUTH_DATABASE_URL: 'postgresql://auth-app:secret@localhost:5432/gamebook',
      JWT_PRIVATE_KEY: privateKey.replace(/\n/g, '\\n'),
      JWT_ISSUER: 'authuser-local',
      JWT_AUDIENCE: 'gamebook-local',
    };

    expect(validateAuthConfiguration(environment)).toMatchObject({
      AUTH_DATABASE_URL: environment.AUTH_DATABASE_URL,
      JWT_PRIVATE_KEY: privateKey.trim(),
      JWT_ISSUER: environment.JWT_ISSUER,
      JWT_AUDIENCE: environment.JWT_AUDIENCE,
    });
  });

  it('fails closed when a required value is missing', () => {
    expect(() => validateAuthConfiguration({})).toThrow('AUTH_DATABASE_URL');
  });

  it('rejects an invalid private key instead of deferring the failure', () => {
    expect(() =>
      validateAuthConfiguration({
        AUTH_DATABASE_URL:
          'postgresql://auth-app:secret@localhost:5432/gamebook',
        JWT_PRIVATE_KEY: 'not-a-private-key',
        JWT_ISSUER: 'authuser-local',
        JWT_AUDIENCE: 'gamebook-local',
      }),
    ).toThrow();
  });
});
