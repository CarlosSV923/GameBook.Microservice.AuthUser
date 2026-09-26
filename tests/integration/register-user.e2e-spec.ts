import { Test } from '@nestjs/testing';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { ApiExceptionFilter } from '../../src/api/http/api-exception.filter.js';
import { createValidationPipe } from '../../src/api/http/validation-pipe.js';
import { REGISTER_USER_USE_CASE } from '../../src/application/ports/dependency-tokens.js';
import { RegisterUserController } from '../../src/api/auth/register-user.controller.js';
import { EmailAlreadyRegisteredError } from '../../src/domain/users/email-already-registered-error.js';

describe('POST /v1/auth/register', () => {
  let app: INestApplication<App>;
  const execute = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleFixture = await Test.createTestingModule({
      controllers: [RegisterUserController],
      providers: [
        { provide: REGISTER_USER_USE_CASE, useValue: { execute } },
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

  it('returns the public identity after creating an account', async () => {
    execute.mockResolvedValue({
      user: {
        id: '7b7f3d2e-6d8d-4e8c-9e0c-2a96f2fb11aa',
        fullName: 'Ada Lovelace',
        email: 'ada.lovelace@example.test',
      },
    });

    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        fullName: 'Ada Lovelace',
        email: 'ada.lovelace@example.test',
        password: 'GameBook@2026',
        passwordConfirmation: 'GameBook@2026',
      })
      .expect(201)
      .expect({
        user: {
          id: '7b7f3d2e-6d8d-4e8c-9e0c-2a96f2fb11aa',
          fullName: 'Ada Lovelace',
          email: 'ada.lovelace@example.test',
        },
      });
  });

  it('rejects invalid fields with the uniform 400 shape', async () => {
    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .set('X-Request-Id', 'req_register_invalid')
      .send({
        fullName: '',
        email: 'invalid-email',
        password: 'short',
        passwordConfirmation: 'short',
      })
      .expect(400)
      .expect((response) => {
        expect(response.body).toMatchObject({
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed.',
          requestId: 'req_register_invalid',
        });
        expect(response.body.details).toEqual(
          expect.arrayContaining([
            { field: 'fullName', reason: 'INVALID_VALUE' },
            { field: 'email', reason: 'INVALID_VALUE' },
            { field: 'password', reason: 'INVALID_VALUE' },
          ]),
        );
      });
    expect(execute).not.toHaveBeenCalled();
  });

  it('returns 409 when the email is already registered', async () => {
    execute.mockRejectedValue(new EmailAlreadyRegisteredError());

    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .set('X-Request-Id', 'req_register_duplicate')
      .send({
        fullName: 'Ada Lovelace',
        email: 'ada.lovelace@example.test',
        password: 'GameBook@2026',
        passwordConfirmation: 'GameBook@2026',
      })
      .expect(409)
      .expect({
        code: 'EMAIL_ALREADY_REGISTERED',
        message: 'The email address is already registered.',
        requestId: 'req_register_duplicate',
      });
  });
});
