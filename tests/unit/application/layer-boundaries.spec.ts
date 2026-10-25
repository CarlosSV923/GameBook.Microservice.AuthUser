import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

describe('application and domain layer boundaries', () => {
  it('keeps NestJS and infrastructure imports out of application and domain', async () => {
    const sourceRoots = ['application', 'domain'].map((layer) =>
      fileURLToPath(new URL(`../../../src/${layer}/`, import.meta.url)),
    );
    const forbiddenImports: string[] = [];

    for (const sourceRoot of sourceRoots) {
      for (const sourceFile of await findTypeScriptFiles(sourceRoot)) {
        const source = await readFile(sourceFile, 'utf8');

        if (
          /(?:\bimport\s+(?:[^'"]+?\s+from\s+)?|\bimport\s*\(\s*)['"]@nestjs\//.test(
            source,
          ) ||
          /(?:from\s+|import\s*\(\s*)['"][^'"]*infrastructure\//.test(source)
        ) {
          forbiddenImports.push(sourceFile);
        }
      }
    }

    expect(forbiddenImports).toEqual([]);
  });
});

async function findTypeScriptFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);

      if (entry.isDirectory()) {
        return findTypeScriptFiles(path);
      }

      return entry.isFile() && entry.name.endsWith('.ts') ? [path] : [];
    }),
  );

  return files.flat();
}
