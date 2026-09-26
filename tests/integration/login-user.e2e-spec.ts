import { Test } from '@nestjs/testing';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { ApiExceptionFilter } from '../../src/api/http/api-exception.filter.js';
import { createValidationPipe } from '../../src/api/http/validation-pipe.js';
import { LOGIN_USER_USE_CASE } from '../../src/application/ports/dependency-tokens.js';
import { LoginUserController } from '../../src/api/auth/login-user.controller.js';
import { InvalidCredentialsError } from '../../src/application/use-cases/login-user.js';

describe('POST /v1/auth/login', () => {
  let app: INestApplication<App>;
  const execute = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleFixture = await Test.createTestingModule({
      controllers: [LoginUserController],
      providers: [
        { provide: LOGIN_USER_USE_CASE, useValue: { execute } },
        { provide: APP_FILTER, useClass: ApiExceptionFilter },
        { provide: APP_PIPE, useFactory: createValidationPipe },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns the token and public identity after valid credentials', async () => {
    execute.mockResolvedValue({
      accessToken: 'signed.jwt.token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
        id: '7b7f3d2e-6d8d-4e8c-9e0c-2a96f2fb11aa',
        fullName: 'Ada Lovelace',
        email: 'ada.lovelace@example.test',
      },
    });

    await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: 'ada.lovelace@example.test',
        password: 'GameBook@2026',
      })
      .expect(200)
      .expect({
        accessToken: 'signed.jwt.token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          id: '7b7f3d2e-6d8d-4e8c-9e0c-2a96f2fb11aa',
          fullName: 'Ada Lovelace',
          email: 'ada.lovelace@example.test',
        },
      });
  });

  it('returns a generic 401 for invalid credentials', async () => {
    execute.mockRejectedValue(new InvalidCredentialsError());

    await request(app.getHttpServer())
      .post('/v1/auth/login')
      .set('X-Request-Id', 'req_login_invalid')
      .send({
        email: 'ada.lovelace@example.test',
        password: 'wrong',
      })
      .expect(401)
      .expect({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
        requestId: 'req_login_invalid',
      });
  });

  it('rejects invalid request fields before the use case', async () => {
    await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'invalid-email', password: '' })
      .expect(400)
      .expect((response) => {
        expect(response.body).toMatchObject({
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed.',
        });
        expect(response.body.details).toEqual(
          expect.arrayContaining([
            { field: 'email', reason: 'INVALID_VALUE' },
            { field: 'password', reason: 'INVALID_VALUE' },
          ]),
        );
      });
    expect(execute).not.toHaveBeenCalled();
  });
});
