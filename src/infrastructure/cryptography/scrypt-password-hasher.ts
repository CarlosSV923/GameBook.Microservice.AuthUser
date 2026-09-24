import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import type { PasswordHasher } from '../../application/ports/password-hasher.js';

const HASH_PREFIX = 'scrypt';
const COST = 16_384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;
const SALT_BYTES = 16;
const KEY_BYTES = 64;
const MAX_MEMORY = 32 * 1024 * 1024;

export class ScryptPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    assertPassword(password);

    const salt = randomBytes(SALT_BYTES);
    const derivedKey = await deriveKey(password, salt);

    return [
      HASH_PREFIX,
      COST,
      BLOCK_SIZE,
      PARALLELIZATION,
      salt.toString('base64url'),
      derivedKey.toString('base64url'),
    ].join('$');
  }

  async verify(password: string, passwordHash: string): Promise<boolean> {
    if (!password || !passwordHash) {
      return false;
    }

    const parsed = parseHash(passwordHash);
    if (!parsed) {
      return false;
    }

    const derivedKey = await deriveKey(password, parsed.salt);
    return (
      derivedKey.length === parsed.expected.length &&
      timingSafeEqual(derivedKey, parsed.expected)
    );
  }
}

function assertPassword(password: string): void {
  if (!password) {
    throw new Error('Cannot hash an empty password.');
  }
}

async function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      KEY_BYTES,
      {
        N: COST,
        r: BLOCK_SIZE,
        p: PARALLELIZATION,
        maxmem: MAX_MEMORY,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey as Buffer);
      },
    );
  });
}

function parseHash(encoded: string): { salt: Buffer; expected: Buffer } | null {
  const [prefix, cost, blockSize, parallelization, saltValue, hashValue] =
    encoded.split('$');

  if (
    prefix !== HASH_PREFIX ||
    cost !== String(COST) ||
    blockSize !== String(BLOCK_SIZE) ||
    parallelization !== String(PARALLELIZATION) ||
    !saltValue ||
    !hashValue
  ) {
    return null;
  }

  try {
    const salt = Buffer.from(saltValue, 'base64url');
    const expected = Buffer.from(hashValue, 'base64url');

    if (salt.length !== SALT_BYTES || expected.length !== KEY_BYTES) {
      return null;
    }

    return { salt, expected };
  } catch {
    return null;
  }
}
