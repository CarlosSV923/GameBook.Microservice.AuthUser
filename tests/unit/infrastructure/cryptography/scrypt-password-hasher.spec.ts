import { ScryptPasswordHasher } from '../../../../src/infrastructure/cryptography/scrypt-password-hasher.js';

describe('ScryptPasswordHasher', () => {
  it('creates salted hashes and verifies only the original password', async () => {
    const hasher = new ScryptPasswordHasher();

    const firstHash = await hasher.hash('GameBook@2026');
    const secondHash = await hasher.hash('GameBook@2026');

    expect(firstHash).toMatch(/^scrypt\$/);
    expect(firstHash).not.toBe(secondHash);
    await expect(hasher.verify('GameBook@2026', firstHash)).resolves.toBe(true);
    await expect(hasher.verify('wrong-password', firstHash)).resolves.toBe(
      false,
    );
    await expect(hasher.verify('GameBook@2026', 'not-a-hash')).resolves.toBe(
      false,
    );
  });

  it('rejects an empty password when creating a hash', async () => {
    await expect(new ScryptPasswordHasher().hash('')).rejects.toThrow(
      'empty password',
    );
  });
});
