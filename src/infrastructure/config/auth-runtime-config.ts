import { createPrivateKey } from 'node:crypto';

export interface AuthRuntimeConfig {
  readonly databaseUrl: string;
  readonly jwtPrivateKey: string;
  readonly jwtIssuer: string;
  readonly jwtAudience: string;
}

export function loadAuthRuntimeConfig(
  environment: NodeJS.ProcessEnv = process.env,
): AuthRuntimeConfig {
  const databaseUrl = required(environment, 'AUTH_DATABASE_URL');
  const jwtPrivateKey = normalizePem(required(environment, 'JWT_PRIVATE_KEY'));
  createPrivateKey(jwtPrivateKey);

  return {
    databaseUrl,
    jwtPrivateKey,
    jwtIssuer: required(environment, 'JWT_ISSUER'),
    jwtAudience: required(environment, 'JWT_AUDIENCE'),
  };
}

function required(environment: NodeJS.ProcessEnv, name: string): string {
  const value = environment[name]?.trim();

  if (!value) {
    throw new Error(`Missing required AuthUser configuration: ${name}`);
  }

  return value;
}

function normalizePem(value: string): string {
  return value.replace(/\\n/g, '\n').trim();
}
