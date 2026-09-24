import { BadRequestException, HttpStatus } from '@nestjs/common';
import { ApiExceptionFilter } from '../../../../src/api/http/api-exception.filter.js';

function createHost() {
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
  const request = {
    requestId: 'req_test_123',
    get: vi.fn(),
  };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  };

  return { host, request, response };
}

describe('ApiExceptionFilter', () => {
  it('returns the uniform validation shape without exposing Nest internals', () => {
    const { host, response } = createHost();
    const filter = new ApiExceptionFilter();

    filter.catch(
      new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'internal validation details',
        details: [{ field: 'email', reason: 'INVALID_EMAIL' }],
      }),
      host as never,
    );

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith({
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed.',
      requestId: 'req_test_123',
      details: [{ field: 'email', reason: 'INVALID_EMAIL' }],
    });
  });

  it('normalizes unexpected exceptions to a safe internal error', () => {
    const { host, response } = createHost();
    const filter = new ApiExceptionFilter();

    filter.catch(
      new Error('database password and JWT must not leak'),
      host as never,
    );

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
      requestId: 'req_test_123',
    });
  });
});
