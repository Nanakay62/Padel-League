import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_SRC = path.resolve(__dirname, '../src');
const TOKENS_CSS = path.resolve(SITE_SRC, 'styles/tokens.css');

// Regex Patterns
const HEX_COLOR_REGEX = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const RAW_RGB_REGEX = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+\s*)?\)/g;
const TAILWIND_CDN_REGEX = /cdn\.tailwindcss\.com/g;
const TAILWIND_GLASS_OR_COLOR_CLASSES = /\b(?:bg-(?:white|blue|slate|zinc|emerald|lime)\/\d+|backdrop-blur(?:-[a-z0-9]+)?|from-[a-z0-9#-]+|via-[a-z0-9#-]+|to-[a-z0-9#-]+|text-blue-\d+|bg-blue-\d+)\b/g;
const INLINE_GRADIENT_REGEX = /linear-gradient\([^)]+\)/g;
const INLINE_BLUR_REGEX = /(?:backdrop-filter|filter):\s*blur\(\s*(?!var\(--glass-)[^)]+\)/gi;

export function scanDirectory(dir, extensions = ['.astro', '.css']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(scanDirectory(fullPath, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      // Exclude tokens.css
      if (fullPath !== TOKENS_CSS && !entry.name.endsWith('.d.ts')) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

export function validateSiteFile(filePath, content) {
  const relPath = path.relative(path.resolve(__dirname, '..'), filePath);
  const lines = content.split('\n');
  const errors = [];

  // Check whole file for CDN
  if (TAILWIND_CDN_REGEX.test(content)) {
    errors.push(`[Tailwind CDN] File "${relPath}" contains Tailwind CDN script! Remove external script.`);
  }

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // Ignore comments
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('<!--')) {
      return;
    }

    // 1. Hex color literals outside tokens.css
    const hexMatches = line.match(HEX_COLOR_REGEX);
    if (hexMatches) {
      errors.push(
        `[Hex Literal] Found "${hexMatches.join(', ')}" at ${relPath}:${lineNum}. Use var(--color-*) from tokens.css.`
      );
    }

    // 2. Raw RGB / RGBA color literals outside tokens.css
    const rgbMatches = line.match(RAW_RGB_REGEX);
    if (rgbMatches) {
      errors.push(
        `[Raw RGB/RGBA] Found "${rgbMatches.join(', ')}" at ${relPath}:${lineNum}. Use var(--glass-*) from tokens.css.`
      );
    }

    // 3. Tailwind color or blur utility classes
    const tailwindMatches = line.match(TAILWIND_GLASS_OR_COLOR_CLASSES);
    if (tailwindMatches) {
      errors.push(
        `[Tailwind Utility Class] Found "${tailwindMatches.join(', ')}" at ${relPath}:${lineNum}. Rebuild with semantic CSS tokens.`
      );
    }

    // 4. Raw inline linear-gradient outside tokens.css
    const gradientMatches = line.match(INLINE_GRADIENT_REGEX);
    if (gradientMatches) {
      errors.push(
        `[Inline Gradient] Found "${gradientMatches.join(', ')}" at ${relPath}:${lineNum}. Gradients are only allowed through var(--gradient-hero) on background bands.`
      );
    }

    // 5. Raw inline blur
    const blurMatches = line.match(INLINE_BLUR_REGEX);
    if (blurMatches) {
      errors.push(
        `[Inline Blur] Found "${blurMatches.join(', ')}" at ${relPath}:${lineNum}. Use var(--glass-blur-radius).`
      );
    }
  });

  return errors;
}

export function runSiteTokenCheck(targetDir = SITE_SRC) {
  const files = scanDirectory(targetDir);
  let totalErrors = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const errors = validateSiteFile(file, content);
    if (errors.length > 0) {
      totalErrors = totalErrors.concat(errors);
    }
  }

  return { filesScanned: files.length, errors: totalErrors };
}

// Self-test with fixture
export function testFailingFixture() {
  const fixturePath = path.resolve(__dirname, 'fixtures/invalid-sample.astro');
  const fixtureContent = fs.readFileSync(fixturePath, 'utf-8');
  const errors = validateSiteFile(fixturePath, fixtureContent);
  return errors;
}

if (process.argv[1] && process.argv[1].endsWith('check-site-tokens.mjs')) {
  console.log('Running Site Token & Class Enforcement Check...');

  // 1. Verify fixture failure first
  const fixtureErrors = testFailingFixture();
  if (fixtureErrors.length < 4) {
    console.error('FAIL: Fixture test did not detect all expected violations! Got:', fixtureErrors);
    process.exit(1);
  }
  console.log(`✅ Proven on fixture: Check correctly detected ${fixtureErrors.length} intentional violations.`);

  // 2. Scan actual source
  const { filesScanned, errors } = runSiteTokenCheck(SITE_SRC);
  console.log(`Scanned ${filesScanned} source files in apps/site/src/`);

  if (errors.length > 0) {
    console.error(`❌ Found ${errors.length} token violations:`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  } else {
    console.log('✅ Site token check passed cleanly! No hardcoded hex/rgb, Tailwind classes, or illegal gradients.');
  }
}
