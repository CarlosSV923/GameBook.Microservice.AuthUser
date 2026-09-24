import {
  createRequestId,
  resolveRequestId,
} from '../../../../src/api/http/request-id.js';

describe('request ids', () => {
  it('generates a request id with a safe prefix', () => {
    expect(createRequestId()).toMatch(/^req_[0-9a-f-]{36}$/);
  });

  it('preserves a safe incoming request id', () => {
    expect(resolveRequestId('req_client_123')).toBe('req_client_123');
  });

  it('replaces malformed or oversized ids', () => {
    expect(resolveRequestId('invalid request id')).toMatch(
      /^req_[0-9a-f-]{36}$/,
    );
    expect(resolveRequestId('a'.repeat(101))).toMatch(/^req_[0-9a-f-]{36}$/);
  });
});
