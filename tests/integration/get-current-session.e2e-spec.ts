import { Test } from '@nestjs/testing';
import { APP_FILTER } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { ApiExceptionFilter } from '../../src/api/http/api-exception.filter.js';
import { GetCurrentSessionController } from '../../src/api/auth/get-current-session.controller.js';
import { VALIDATE_SESSION_USE_CASE } from '../../src/application/ports/dependency-tokens.js';
import {
  SessionValidationError,
  type SessionValidationErrorCode,
} from '../../src/application/use-cases/validate-session.js';

describe('GET /v1/auth/session', () => {
  let app: INestApplication<App>;
  const execute = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleFixture = await Test.createTestingModule({
      controllers: [GetCurrentSessionController],
      providers: [
        { provide: VALIDATE_SESSION_USE_CASE, useValue: { execute } },
        { provide: APP_FILTER, useClass: ApiExceptionFilter },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns the current public identity for a valid Bearer token', async () => {
    execute.mockResolvedValue({
      user: {
        id: '7b7f3d2e-6d8d-4e8c-9e0c-2a96f2fb11aa',
        fullName: 'Ada Lovelace',
        email: 'ada.lovelace@example.test',
      },
    });

    await request(app.getHttpServer())
      .get('/v1/auth/session')
      .set('Authorization', 'Bearer signed.jwt.token')
      .expect(200)
      .expect({
        user: {
          id: '7b7f3d2e-6d8d-4e8c-9e0c-2a96f2fb11aa',
          fullName: 'Ada Lovelace',
          email: 'ada.lovelace@example.test',
        },
      });
    expect(execute).toHaveBeenCalledWith('signed.jwt.token');
  });

  it('rejects a missing Authorization header with TOKEN_MISSING', async () => {
    await request(app.getHttpServer())
      .get('/v1/auth/session')
      .set('X-Request-Id', 'req_session_missing')
      .expect(401)
      .expect({
        code: 'TOKEN_MISSING',
        message: 'Authentication is required.',
        requestId: 'req_session_missing',
      });
    expect(execute).not.toHaveBeenCalled();
  });

  it('rejects malformed Authorization schemes with TOKEN_INVALID', async () => {
    await request(app.getHttpServer())
      .get('/v1/auth/session')
      .set('Authorization', 'Basic signed.jwt.token')
      .expect(401)
      .expect((response) => {
        expect(response.body).toMatchObject({
          code: 'TOKEN_INVALID',
          message: 'Authentication is not valid.',
        });
      });

    await request(app.getHttpServer())
      .get('/v1/auth/session')
      .set('Authorization', 'Bearer one two')
      .expect(401)
      .expect((response) => {
        expect(response.body.code).toBe('TOKEN_INVALID');
      });
    expect(execute).not.toHaveBeenCalled();
  });

  it.each([
    ['TOKEN_INVALID', 'Authentication is not valid.'],
    ['TOKEN_EXPIRED', 'Authentication has expired.'],
    ['SESSION_REVOKED', 'Authentication is no longer valid.'],
  ])(
    'maps %s session failures to the contractual 401 response',
    async (code, message) => {
      execute.mockRejectedValue(
        new SessionValidationError(code as SessionValidationErrorCode),
      );

      await request(app.getHttpServer())
        .get('/v1/auth/session')
        .set('Authorization', 'Bearer signed.jwt.token')
        .expect(401)
        .expect((response) => {
          expect(response.body).toMatchObject({ code, message });
        });
    },
  );
});
