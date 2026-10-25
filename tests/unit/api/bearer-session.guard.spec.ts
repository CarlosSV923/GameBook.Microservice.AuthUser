import type { ExecutionContext } from '@nestjs/common';
import { BearerSessionGuard } from '../../../src/api/auth/bearer-session.guard.ts';
import { SessionValidationError } from '../../../src/application/use-cases/validate-session.ts';

describe('BearerSessionGuard', () => {
  const validate = vi.fn();
  const guard = new BearerSessionGuard({ validate } as never);
  const request = {
    headers: {} as Record<string, string>,
    currentSession: undefined as unknown,
  };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as ExecutionContext;

  beforeEach(() => {
    vi.clearAllMocks();
    request.headers = {};
    request.currentSession = undefined;
  });

  it('rejects a missing header with TOKEN_MISSING', async () => {
    await expect(guard.canActivate(context)).rejects.toMatchObject({
      response: { code: 'TOKEN_MISSING' },
    });
    expect(validate).not.toHaveBeenCalled();
  });

  it('rejects a malformed header with TOKEN_INVALID', async () => {
    request.headers.authorization = 'Basic abc';
    await expect(guard.canActivate(context)).rejects.toMatchObject({
      response: { code: 'TOKEN_INVALID' },
    });
    expect(validate).not.toHaveBeenCalled();
  });

  it.each([
    'TOKEN_INVALID',
    'TOKEN_EXPIRED',
    'SESSION_REVOKED',
    'ACCOUNT_DISABLED',
  ])('maps %s validation failures to the same 401 code', async (code) => {
    request.headers.authorization = 'Bearer signed.jwt.token';
    validate.mockRejectedValue(new SessionValidationError(code as never));
    await expect(guard.canActivate(context)).rejects.toMatchObject({
      response: { code },
      status: 401,
    });
  });

  it('validates the token and attaches its authenticated identity', async () => {
    request.headers.authorization = 'Bearer signed.jwt.token';
    validate.mockResolvedValue({
      claims: { sub: 'user-id', ver: 7 },
      user: { fullName: 'Ada Lovelace', email: 'ada@example.test' },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(validate).toHaveBeenCalledWith('signed.jwt.token');
    expect(request.currentSession).toEqual({
      userId: 'user-id',
      sessionVersion: 7,
      fullName: 'Ada Lovelace',
      email: 'ada@example.test',
    });
  });
});
