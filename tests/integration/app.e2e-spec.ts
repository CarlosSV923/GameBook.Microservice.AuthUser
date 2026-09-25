import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module.js';
import { configureHttpApplication } from '../../src/api/http/configure-http-application.js';
import { generateDevelopmentKeyPair } from '../../src/infrastructure/cryptography/rsa-jwt.js';

const testKeyPair = generateDevelopmentKeyPair();
const originalEnvironment = {
  AUTH_DATABASE_URL: process.env.AUTH_DATABASE_URL,
  JWT_PRIVATE_KEY: process.env.JWT_PRIVATE_KEY,
  JWT_ISSUER: process.env.JWT_ISSUER,
  JWT_AUDIENCE: process.env.JWT_AUDIENCE,
};

describe('HTTP application (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(() => {
    process.env.AUTH_DATABASE_URL =
      'postgresql://runtime_user:runtime_password@localhost:5432/gamebook?schema=auth';
    process.env.JWT_PRIVATE_KEY = testKeyPair.privateKey;
    process.env.JWT_ISSUER = 'gamebook-authuser-test';
    process.env.JWT_AUDIENCE = 'gamebook-test';
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureHttpApplication(app, {
      ...process.env,
      CORS_ALLOWED_ORIGINS: 'http://frontend.test',
    });
    await app.init();
  });

  it('returns a request id for a real AuthUser request', () => {
    return request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({})
      .expect(400)
      .expect('x-request-id', /^req_[0-9a-f-]{36}$/);
  });

  it('serves a contract-aligned OpenAPI document with Bearer security', async () => {
    await request(app.getHttpServer()).get('/docs').redirects(1).expect(200);

    const response = await request(app.getHttpServer())
      .get('/docs/openapi.json')
      .expect(200);

    expect(response.body).toMatchObject({
      openapi: '3.0.0',
      info: {
        title: 'GameBook AuthUser API',
        version: '0.1.0',
      },
    });
    expect(response.body.tags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Authentication' }),
        expect.objectContaining({ name: 'User' }),
      ]),
    );
    expect(response.body.components.securitySchemes.BearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });

    const paths = response.body.paths;
    expect(paths['/v1/auth/register'].post.operationId).toBe('registerUser');
    expect(paths['/v1/auth/login'].post.operationId).toBe('loginUser');
    expect(paths['/v1/auth/session'].get.operationId).toBe('getCurrentSession');
    expect(paths['/v1/users/me/password'].patch.operationId).toBe(
      'changeMyPassword',
    );
    expect(paths['/v1/auth/session'].get.security).toEqual([
      { BearerAuth: [] },
    ]);
    expect(paths['/v1/users/me/password'].patch.security).toEqual([
      { BearerAuth: [] },
    ]);
    expect(paths['/v1/users/me/password'].patch.responses['204']).toBeDefined();

    expect(JSON.stringify(response.body)).not.toMatch(
      /PRIVATE KEY|client_secret|access_token:|Bearer ey/u,
    );
  });

  it('preserves a safe request id and allows its configured CORS origin', () => {
    return request(app.getHttpServer())
      .post('/v1/auth/login')
      .set('Origin', 'http://frontend.test')
      .set('X-Request-Id', 'req_client_123')
      .send({})
      .expect(400)
      .expect('x-request-id', 'req_client_123')
      .expect('access-control-allow-origin', 'http://frontend.test');
  });

  it('does not expose CORS permission for an unconfigured origin', () => {
    return request(app.getHttpServer())
      .post('/v1/auth/login')
      .set('Origin', 'http://untrusted.test')
      .send({})
      .expect(400)
      .expect((response) => {
        expect(response.headers['access-control-allow-origin']).toBeUndefined();
      });
  });

  it('returns the uniform error shape for an unknown route', () => {
    return request(app.getHttpServer())
      .get('/unknown')
      .expect(404)
      .expect((response) => {
        expect(response.body).toMatchObject({
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred.',
        });
        expect(response.body.requestId).toMatch(/^req_[0-9a-f-]{36}$/);
      });
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(() => {
    for (const [name, value] of Object.entries(originalEnvironment)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  });
});
