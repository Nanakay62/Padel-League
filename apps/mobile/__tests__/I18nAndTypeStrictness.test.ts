import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve(__dirname, '../src');

function getAllSourceFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.resolve(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllSourceFiles(fullPath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      if (!file.endsWith('.d.ts')) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const ANY_TYPE_REGEX = /(?:as\s+any\b|:\s*any\b)/;

describe('Engineering Foundation: Type Strictness & i18n Completeness', () => {
  const sourceFiles = getAllSourceFiles(SRC_DIR);

  it('scans all TypeScript source files in src/', () => {
    expect(sourceFiles.length).toBeGreaterThan(10);
  });

  describe('Zero "any" type annotations or assertions', () => {
    for (const filePath of sourceFiles) {
      const relPath = path.relative(SRC_DIR, filePath);

      it(`file "${relPath}" contains zero "any" types`, () => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const anyErrors: string[] = [];

        lines.forEach((line: string, index: number) => {
          const lineNum = index + 1;
          const trimmed = line.trim();

          // Skip comments
          if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            return;
          }

          if (ANY_TYPE_REGEX.test(line)) {
            anyErrors.push(`[Explicit Any] Found "${trimmed}" at ${relPath}:${lineNum}`);
          }
        });

        expect(anyErrors).toEqual([]);
      });
    }
  });

  describe('i18n Translation Dictionary Integrity', () => {
    it('verifies all translation keys used in source code exist in i18n dictionary', () => {
      const i18nPath = path.resolve(SRC_DIR, 'lib/i18n.ts');
      const i18nContent = fs.readFileSync(i18nPath, 'utf-8');

      // Extract all defined translation keys from i18n.ts
      const keyMatches = i18nContent.match(/([a-zA-Z0-9_]+):\s*['"`]/g) || [];
      const definedKeys = new Set(keyMatches.map((m) => m.split(':')[0].trim()));

      expect(definedKeys.size).toBeGreaterThan(50);

      // Verify every t('...') call across codebase uses a defined key
      const missingKeys: string[] = [];
      const T_CALL_REGEX = /\bt\(\s*['"]([a-zA-Z0-9_]+)['"]/g;

      for (const filePath of sourceFiles) {
        const relPath = path.relative(SRC_DIR, filePath);
        const content = fs.readFileSync(filePath, 'utf-8');
        let match;
        while ((match = T_CALL_REGEX.exec(content)) !== null) {
          const key = match[1];
          if (!definedKeys.has(key)) {
            missingKeys.push(`Undefined key "${key}" used in ${relPath}`);
          }
        }
      }

      expect(missingKeys).toEqual([]);
    });
  });
});
