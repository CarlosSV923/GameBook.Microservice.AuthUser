import { Test, type TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../../src/app.module.js';
import { configureHttpApplication } from '../../src/api/http/configure-http-application.js';
import { USER_REPOSITORY } from '../../src/application/ports/dependency-tokens.js';
import { EmailAlreadyRegisteredError } from '../../src/domain/users/email-already-registered-error.js';
import type { EmailAddress } from '../../src/domain/users/email-address.js';
import type { UserRepository } from '../../src/domain/users/user-repository.js';
import { User } from '../../src/domain/users/user.js';
import {
  generateDevelopmentKeyPair,
  RsaJwtSigner,
} from '../../src/infrastructure/cryptography/rsa-jwt.js';

class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();

  clear(): void {
    this.users.clear();
  }

  findById(id: string): Promise<User | null> {
    return Promise.resolve(this.users.get(id) ?? null);
  }

  findByEmail(email: EmailAddress): Promise<User | null> {
    return Promise.resolve(
      [...this.users.values()].find((user) => user.email === email.value) ??
        null,
    );
  }

  async save(user: User): Promise<void> {
    if ([...this.users.values()].some((item) => item.email === user.email)) {
      throw new EmailAlreadyRegisteredError();
    }

    this.users.set(user.id, user);
  }

  async replacePassword(
    id: string,
    passwordHash: string,
    expectedSessionVersion: number,
  ): Promise<boolean> {
    const user = this.users.get(id);
    if (!user || user.sessionVersion !== expectedSessionVersion) {
      return false;
    }

    user.changePasswordHash(passwordHash);
    return true;
  }
}

const testKeyPair = generateDevelopmentKeyPair();
const originalEnvironment = {
  AUTH_DATABASE_URL: process.env.AUTH_DATABASE_URL,
  JWT_PRIVATE_KEY: process.env.JWT_PRIVATE_KEY,
  JWT_ISSUER: process.env.JWT_ISSUER,
  JWT_AUDIENCE: process.env.JWT_AUDIENCE,
};

describe('AuthUser real HTTP flow', () => {
  let app: INestApplication<App>;
  const repository = new InMemoryUserRepository();

  beforeAll(async () => {
    process.env.AUTH_DATABASE_URL =
      'postgresql://runtime_user:runtime_password@localhost:5432/gamebook?schema=auth';
    process.env.JWT_PRIVATE_KEY = testKeyPair.privateKey;
    process.env.JWT_ISSUER = 'gamebook-authuser-test';
    process.env.JWT_AUDIENCE = 'gamebook-test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(USER_REPOSITORY)
      .useValue(repository)
      .compile();

    app = moduleFixture.createNestApplication();
    configureHttpApplication(app, {
      ...process.env,
      CORS_ALLOWED_ORIGINS: 'http://frontend.test',
    });
    await app.init();
  });

  beforeEach(() => {
    repository.clear();
  });

  afterAll(async () => {
    await app.close();

    for (const [name, value] of Object.entries(originalEnvironment)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  });

  it('registers an account and rejects a duplicate email', async () => {
    const account = {
      fullName: 'Ada Lovelace',
      email: 'ada.lovelace@example.test',
      password: 'GameBook@2026',
      passwordConfirmation: 'GameBook@2026',
    };

    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send(account)
      .expect(201);

    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send(account)
      .expect(409)
      .expect((response) => {
        expect(response.body.code).toBe('EMAIL_ALREADY_REGISTERED');
      });
  });

  it('logs in, validates the session and classifies an expired JWT', async () => {
    const user = await registerUser();
    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: 'ada.lovelace@example.test',
        password: 'GameBook@2026',
      })
      .expect(200);

    await request(app.getHttpServer())
      .get('/v1/auth/session')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200)
      .expect({
        user: {
          id: user.id,
          fullName: 'Ada Lovelace',
          email: 'ada.lovelace@example.test',
        },
      });

    const now = Math.floor(Date.now() / 1000);
    const expiredToken = await new RsaJwtSigner(testKeyPair.privateKey).sign({
      sub: user.id,
      ver: 1,
      iat: now - 7200,
      exp: now - 1,
      iss: 'gamebook-authuser-test',
      aud: 'gamebook-test',
    });

    await request(app.getHttpServer())
      .get('/v1/auth/session')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401)
      .expect((response) => {
        expect(response.body.code).toBe('TOKEN_EXPIRED');
      });
  });

  it('changes the password and revokes the current JWT immediately', async () => {
    await registerUser();
    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: 'ada.lovelace@example.test',
        password: 'GameBook@2026',
      })
      .expect(200);

    await request(app.getHttpServer())
      .patch('/v1/users/me/password')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({
        currentPassword: 'GameBook@2026',
        newPassword: 'GameBook#2027',
      })
      .expect(204);

    await request(app.getHttpServer())
      .get('/v1/auth/session')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(401)
      .expect((response) => {
        expect(response.body.code).toBe('SESSION_REVOKED');
      });

    await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: 'ada.lovelace@example.test',
        password: 'GameBook@2026',
      })
      .expect(401)
      .expect((response) => {
        expect(response.body.code).toBe('INVALID_CREDENTIALS');
      });

    await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: 'ada.lovelace@example.test',
        password: 'GameBook#2027',
      })
      .expect(200);
  });

  async function registerUser(): Promise<{ id: string }> {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        fullName: 'Ada Lovelace',
        email: 'ada.lovelace@example.test',
        password: 'GameBook@2026',
        passwordConfirmation: 'GameBook@2026',
      })
      .expect(201);

    return response.body.user;
  }
});
