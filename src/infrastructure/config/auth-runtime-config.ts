import { createPrivateKey } from 'node:crypto';

export interface AuthEnvironment {
  readonly AUTH_DATABASE_URL: string;
  readonly JWT_PRIVATE_KEY: string;
  readonly JWT_ISSUER: string;
  readonly JWT_AUDIENCE: string;
}

export function validateAuthConfiguration(
  environment: Record<string, unknown>,
): Record<string, unknown> {
  const databaseUrl = required(environment, 'AUTH_DATABASE_URL');
  const jwtPrivateKey = normalizePem(required(environment, 'JWT_PRIVATE_KEY'));
  createPrivateKey(jwtPrivateKey);

  return {
    ...environment,
    AUTH_DATABASE_URL: databaseUrl,
    JWT_PRIVATE_KEY: jwtPrivateKey,
    JWT_ISSUER: required(environment, 'JWT_ISSUER'),
    JWT_AUDIENCE: required(environment, 'JWT_AUDIENCE'),
  };
}

function required(environment: Record<string, unknown>, name: string): string {
  const rawValue = environment[name];
  const value = typeof rawValue === 'string' ? rawValue.trim() : undefined;

  if (!value) {
    throw new Error(`Missing required AuthUser configuration: ${name}`);
  }

  return value;
}

function normalizePem(value: string): string {
  return value.replace(/\\n/g, '\n').trim();
}
