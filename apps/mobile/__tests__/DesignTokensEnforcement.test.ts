import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve(__dirname, '../src');

// Files allowed to define the root tokens or CSS
const EXEMPT_FILES = [
  path.resolve(SRC_DIR, 'constants/theme.ts'),
  path.resolve(SRC_DIR, 'global.css'),
];

function getAllSourceFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.resolve(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllSourceFiles(fullPath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      if (!EXEMPT_FILES.includes(fullPath) && !file.endsWith('.d.ts')) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

// Regex patterns to enforce
const HEX_COLOR_REGEX = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const EMOJI_REGEX = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|[\u2194-\u21aa]|[\u2934-\u2935]|[\u25aa-\u25ab]|[\u25b6\u25c0]|[\u25fb-\u25fe]|\u00a9|\u00ae|[\u2122\u2139]|\ud83c\udc04|[\ud83c\udca0-\ud83c\udcff]|[\ud83d\udc00-\ud83d\ude4f]|[\ud83d\ude80-\ud83d\udefc]|[\ud83e\udd00-\ud83e\udfff])/u;
const ARROW_REGEX = /[→←]/;
const RAW_FONT_FAMILY_REGEX = /fontFamily:\s*['"][^'"]+['"]/g;
const RAW_FONT_SIZE_REGEX = /fontSize:\s*\d+/g;
const RAW_FONT_WEIGHT_REGEX = /fontWeight:\s*['"](?:bold|normal|[1-9]00)['"]/g;
const HEAVY_FONT_WEIGHT_REGEX = /fontWeight:\s*['"](?:800|900)['"]|font-extrabold|font-black/g;

describe('Design Tokens & Style Enforcement', () => {
  const sourceFiles = getAllSourceFiles(SRC_DIR);

  it('found source files to scan in src/', () => {
    expect(sourceFiles.length).toBeGreaterThan(5);
  });

  describe('Strict Design Rules across all components and screens', () => {
    for (const filePath of sourceFiles) {
      const relPath = path.relative(SRC_DIR, filePath);

      it(`file "${relPath}" adheres to design tokens`, () => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const errors: string[] = [];

        lines.forEach((line: string, index: number) => {
          const lineNum = index + 1;
          const trimmed = line.trim();

          // Skip comments
          if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            return;
          }

          // 1. No hex color literals outside theme.ts
          const hexMatches = line.match(HEX_COLOR_REGEX);
          if (hexMatches) {
            errors.push(
              `[Hex Literal] Found "${hexMatches.join(', ')}" at ${relPath}:${lineNum}. Use Tokens.colors or Colors instead.`
            );
          }

          // 2. No emojis anywhere in UI code
          if (EMOJI_REGEX.test(line)) {
            errors.push(
              `[Emoji Found] Found emoji character at ${relPath}:${lineNum}. Use Lucide line icons instead.`
            );
          }

          // 3. No button arrows (→, ←)
          if (ARROW_REGEX.test(line)) {
            errors.push(
              `[Arrow Found] Found arrow character at ${relPath}:${lineNum}. Remove arrows from button/label text.`
            );
          }

          // 4. No raw fontFamily
          const fontFamMatches = line.match(RAW_FONT_FAMILY_REGEX);
          if (fontFamMatches) {
            errors.push(
              `[Hardcoded Font Family] Found "${fontFamMatches.join(', ')}" at ${relPath}:${lineNum}. Use Typography.fontFamily instead.`
            );
          }

          // 5. No raw fontSize numbers
          const fontSizeMatches = line.match(RAW_FONT_SIZE_REGEX);
          if (fontSizeMatches) {
            errors.push(
              `[Raw Font Size] Found "${fontSizeMatches.join(', ')}" at ${relPath}:${lineNum}. Use Tokens.fontSize or Typography.fontSize instead.`
            );
          }

          // 6. No raw fontWeight literals
          const fontWeightMatches = line.match(RAW_FONT_WEIGHT_REGEX);
          if (fontWeightMatches) {
            errors.push(
              `[Raw Font Weight] Found "${fontWeightMatches.join(', ')}" at ${relPath}:${lineNum}. Use Tokens.fontWeight or Typography.fontWeight instead.`
            );
          }

          // 7. No 800 or 900 heavy weights
          const heavyMatches = line.match(HEAVY_FONT_WEIGHT_REGEX);
          if (heavyMatches) {
            errors.push(
              `[Heavy Font Weight] Found 800/900 weight at ${relPath}:${lineNum}. Max allowed weight is semibold (600).`
            );
          }
        });

        expect(errors).toEqual([]);
      });
    }
  });
});
