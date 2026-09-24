import {
  createPrivateKey,
  createPublicKey,
  createSign,
  createVerify,
  generateKeyPairSync,
  type KeyObject,
} from 'node:crypto';
import type {
  JwtClaims,
  JwtSigner,
  JwtVerifier,
} from '../../application/ports/jwt-ports.js';

const JWT_HEADER = { alg: 'RS256', typ: 'JWT' } as const;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export class RsaJwtSigner implements JwtSigner {
  private readonly privateKey: KeyObject;

  constructor(privateKeyPem: string) {
    this.privateKey = createPrivateKey(privateKeyPem);
  }

  sign(claims: JwtClaims): Promise<string> {
    const encodedHeader = encodeJson(JWT_HEADER);
    const encodedPayload = encodeJson(claims);
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const signature = createSign('RSA-SHA256')
      .update(signingInput)
      .end()
      .sign(this.privateKey)
      .toString('base64url');

    return Promise.resolve(`${signingInput}.${signature}`);
  }
}

export class RsaJwtVerifier implements JwtVerifier {
  private readonly publicKey: KeyObject;

  constructor(
    publicKeyPem: string,
    private readonly issuer: string,
    private readonly audience: string,
    private readonly now: () => number = () => Math.floor(Date.now() / 1000),
  ) {
    this.publicKey = createPublicKey(publicKeyPem);
  }

  verify(token: string): Promise<JwtClaims> {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
    if (!encodedHeader || !encodedPayload || !encodedSignature) {
      return Promise.reject(new JwtVerificationError());
    }

    let header: unknown;
    let claims: unknown;
    let signature: Buffer;
    try {
      header = decodeJson(encodedHeader);
      claims = decodeJson(encodedPayload);
      signature = Buffer.from(encodedSignature, 'base64url');
    } catch {
      return Promise.reject(new JwtVerificationError());
    }

    if (
      !isRecord(header) ||
      header.alg !== JWT_HEADER.alg ||
      header.typ !== JWT_HEADER.typ ||
      !createVerify('RSA-SHA256')
        .update(`${encodedHeader}.${encodedPayload}`)
        .end()
        .verify(this.publicKey, signature)
    ) {
      return Promise.reject(new JwtVerificationError());
    }

    try {
      return Promise.resolve(this.assertClaims(claims));
    } catch {
      return Promise.reject(new JwtVerificationError());
    }
  }

  private assertClaims(value: unknown): JwtClaims {
    if (!isRecord(value)) {
      throw new Error('Invalid JWT claims.');
    }

    const { sub, ver, iat, exp, iss, aud } = value;
    if (
      typeof sub !== 'string' ||
      !UUID_PATTERN.test(sub) ||
      !isPositiveInteger(ver) ||
      !isNonNegativeInteger(iat) ||
      !isNonNegativeInteger(exp) ||
      exp <= this.now() ||
      iss !== this.issuer ||
      aud !== this.audience
    ) {
      throw new Error('Invalid JWT claims.');
    }

    return { sub, ver, iat, exp, iss, aud };
  }
}

export class JwtVerificationError extends Error {
  constructor() {
    super('JWT verification failed.');
    this.name = 'JwtVerificationError';
  }
}

export function derivePublicKey(privateKeyPem: string): string {
  return createPublicKey(createPrivateKey(privateKeyPem))
    .export({ type: 'spki', format: 'pem' })
    .toString();
}

export function generateDevelopmentKeyPair(): {
  privateKey: string;
  publicKey: string;
} {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });

  return { privateKey, publicKey };
}

function encodeJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function decodeJson(value: string): unknown {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}
