import {
  createCorsOptions,
  getAllowedCorsOrigins,
} from '../../../../src/api/http/cors-options.js';

describe('CORS options', () => {
  it('parses an explicit origin list and ignores wildcard values', () => {
    expect(
      getAllowedCorsOrigins({
        CORS_ALLOWED_ORIGINS:
          ' http://localhost:3000, https://portfolio.test, * ',
      }),
    ).toEqual(['http://localhost:3000', 'https://portfolio.test']);
  });

  it('allows only exact configured origins', () => {
    const options = createCorsOptions({
      CORS_ALLOWED_ORIGINS: 'http://localhost:3000',
    });
    const callback = vi.fn();

    options.origin('http://localhost:3000', callback);
    expect(callback).toHaveBeenCalledWith(null, true);

    options.origin('http://localhost:3001', callback);
    expect(callback).toHaveBeenLastCalledWith(null, false);
  });

  it('does not reject requests without an Origin header when configuration is absent', () => {
    const options = createCorsOptions({});
    const callback = vi.fn();

    options.origin(undefined, callback);

    expect(callback).toHaveBeenCalledWith(null, true);
    expect(options.credentials).toBe(false);
    expect(options.exposedHeaders).toContain('X-Request-Id');
  });
});
