import {
  derivePublicKey,
  generateDevelopmentKeyPair,
  JwtExpiredError,
  RsaJwtSigner,
  RsaJwtVerifier,
} from '../../../../src/infrastructure/cryptography/rsa-jwt.js';

const claims = {
  sub: '7b7f3d2e-6d8d-4e8c-9e0c-2a96f2fb11aa',
  ver: 1,
  iat: 1_790_100_000,
  exp: 1_790_103_600,
  iss: 'authuser-local',
  aud: 'gamebook-local',
} as const;

describe('RS256 JWT adapters', () => {
  it('generates a development pair and signs/verifies the contract claims', async () => {
    const keyPair = generateDevelopmentKeyPair();
    const signer = new RsaJwtSigner(keyPair.privateKey);
    const verifier = new RsaJwtVerifier(
      keyPair.publicKey,
      claims.iss,
      claims.aud,
      () => 1_790_100_001,
    );

    const token = await signer.sign(claims);
    const [encodedHeader] = token.split('.');

    expect(
      JSON.parse(Buffer.from(encodedHeader, 'base64url').toString()),
    ).toEqual({ alg: 'RS256', typ: 'JWT' });
    await expect(verifier.verify(token)).resolves.toEqual(claims);
    expect(derivePublicKey(keyPair.privateKey)).toBe(keyPair.publicKey);
  });

  it('rejects tampering, expiration, and issuer or audience mismatches', async () => {
    const keyPair = generateDevelopmentKeyPair();
    const token = await new RsaJwtSigner(keyPair.privateKey).sign(claims);
    const verifier = new RsaJwtVerifier(
      keyPair.publicKey,
      claims.iss,
      claims.aud,
      () => claims.exp,
    );

    await expect(verifier.verify(`${token}tampered`)).rejects.toThrow(
      'JWT verification failed',
    );
    await expect(verifier.verify(token)).rejects.toBeInstanceOf(
      JwtExpiredError,
    );
    await expect(
      new RsaJwtVerifier(
        keyPair.publicKey,
        'wrong-issuer',
        claims.aud,
        () => 1_790_100_001,
      ).verify(token),
    ).rejects.toThrow('JWT verification failed');
  });
});
