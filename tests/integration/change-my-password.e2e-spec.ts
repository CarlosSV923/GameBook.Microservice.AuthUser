import { Test } from '@nestjs/testing';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { ApiExceptionFilter } from '../../src/api/http/api-exception.filter.js';
import { createValidationPipe } from '../../src/api/http/validation-pipe.js';
import { ChangeMyPasswordController } from '../../src/api/users/change-my-password.controller.js';
import { CHANGE_PASSWORD_USE_CASE } from '../../src/application/ports/dependency-tokens.js';
import {
  ChangePasswordValidationError,
  InvalidCurrentPasswordError,
} from '../../src/application/use-cases/change-password.js';
import { SessionValidationError } from '../../src/application/use-cases/validate-session.js';

describe('PATCH /v1/users/me/password', () => {
  let app: INestApplication<App>;
  const execute = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleFixture = await Test.createTestingModule({
      controllers: [ChangeMyPasswordController],
      providers: [
        { provide: CHANGE_PASSWORD_USE_CASE, useValue: { execute } },
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

  it('returns 204 after changing the authenticated user password', async () => {
    execute.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .patch('/v1/users/me/password')
      .set('Authorization', 'Bearer signed.jwt.token')
      .send({
        currentPassword: 'OldPassword@2026',
        newPassword: 'NewPassword@2026',
      })
      .expect(204)
      .expect('');

    expect(execute).toHaveBeenCalledWith({
      token: 'signed.jwt.token',
      currentPassword: 'OldPassword@2026',
      newPassword: 'NewPassword@2026',
    });
  });

  it('rejects a missing or malformed bearer token', async () => {
    await request(app.getHttpServer())
      .patch('/v1/users/me/password')
      .send({
        currentPassword: 'OldPassword@2026',
        newPassword: 'NewPassword@2026',
      })
      .expect(401)
      .expect((response) => {
        expect(response.body).toMatchObject({
          code: 'TOKEN_MISSING',
          message: 'Authentication is required.',
        });
      });

    await request(app.getHttpServer())
      .patch('/v1/users/me/password')
      .set('Authorization', 'Basic credentials')
      .send({
        currentPassword: 'OldPassword@2026',
        newPassword: 'NewPassword@2026',
      })
      .expect(401)
      .expect((response) => {
        expect(response.body).toMatchObject({ code: 'TOKEN_INVALID' });
      });

    expect(execute).not.toHaveBeenCalled();
  });

  it('maps authentication and current-password failures to 401', async () => {
    execute.mockRejectedValueOnce(
      new SessionValidationError('SESSION_REVOKED'),
    );

    await request(app.getHttpServer())
      .patch('/v1/users/me/password')
      .set('Authorization', 'Bearer revoked.jwt.token')
      .send({
        currentPassword: 'OldPassword@2026',
        newPassword: 'NewPassword@2026',
      })
      .expect(401)
      .expect((response) => {
        expect(response.body).toMatchObject({ code: 'SESSION_REVOKED' });
      });

    execute.mockRejectedValueOnce(new InvalidCurrentPasswordError());

    await request(app.getHttpServer())
      .patch('/v1/users/me/password')
      .set('Authorization', 'Bearer signed.jwt.token')
      .send({
        currentPassword: 'WrongPassword@2026',
        newPassword: 'NewPassword@2026',
      })
      .expect(401)
      .expect((response) => {
        expect(response.body).toMatchObject({
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials.',
        });
      });
  });

  it('maps the new-password policy failure to the uniform validation response', async () => {
    execute.mockRejectedValue(
      new ChangePasswordValidationError(
        'newPassword',
        'PASSWORD_POLICY_NOT_MET',
      ),
    );

    await request(app.getHttpServer())
      .patch('/v1/users/me/password')
      .set('Authorization', 'Bearer signed.jwt.token')
      .send({
        currentPassword: 'OldPassword@2026',
        newPassword: 'Weakpassword',
      })
      .expect(400)
      .expect((response) => {
        expect(response.body).toMatchObject({
          code: 'VALIDATION_ERROR',
          details: [
            { field: 'newPassword', reason: 'PASSWORD_POLICY_NOT_MET' },
          ],
        });
      });
  });

  it('rejects request data before invoking the use case', async () => {
    await request(app.getHttpServer())
      .patch('/v1/users/me/password')
      .set('Authorization', 'Bearer signed.jwt.token')
      .send({ currentPassword: '', newPassword: 'short' })
      .expect(400)
      .expect((response) => {
        expect(response.body).toMatchObject({ code: 'VALIDATION_ERROR' });
      });

    expect(execute).not.toHaveBeenCalled();
  });
});
