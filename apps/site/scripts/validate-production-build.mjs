import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FORBIDDEN_HOST_PATTERNS = [
  /localhost/i,
  /127\.0\.0\.1/i,
  /\[::1\]/i,
  /stitch\.google\.com/i,
];

const STITCH_STRING_PATTERN = /stitch\.google\.com/i;

/**
 * Validates that production environment variables are properly set and non-local.
 * @param {Record<string, string | undefined>} env
 * @returns {string[]} List of validation error messages.
 */
export function validateEnvironment(env = process.env) {
  const errors = [];
  const appUrl = (env.APP_URL || '').trim();
  const siteUrl = (env.SITE_URL || '').trim();

  // 1. APP_URL check
  if (!appUrl) {
    errors.push('[Production Gate] APP_URL environment variable is required and cannot be empty.');
  } else {
    for (const pattern of FORBIDDEN_HOST_PATTERNS) {
      if (pattern.test(appUrl)) {
        errors.push(`[Production Gate] APP_URL "${appUrl}" is invalid for production: matches forbidden pattern ${pattern}.`);
      }
    }
  }

  // 2. SITE_URL check
  if (!siteUrl) {
    errors.push('[Production Gate] SITE_URL environment variable is required and cannot be empty.');
  } else {
    for (const pattern of FORBIDDEN_HOST_PATTERNS) {
      if (pattern.test(siteUrl)) {
        errors.push(`[Production Gate] SITE_URL "${siteUrl}" is invalid for production: matches forbidden pattern ${pattern}.`);
      }
    }
  }

  return errors;
}

/**
 * Recursively scans directory for files matching extensions.
 * @param {string} dir
 * @param {string[]} extensions
 * @returns {string[]}
 */
export function scanDirectory(dir, extensions = ['.html', '.js', '.css', '.json']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(scanDirectory(fullPath, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Validates that built output in dist directory does not contain forbidden Stitch strings.
 * @param {string} distDir
 * @returns {string[]} List of validation error messages.
 */
export function validateDistOutput(distDir) {
  const errors = [];
  if (!fs.existsSync(distDir)) {
    errors.push(`[Production Gate] Built output directory "${distDir}" does not exist. Run build first.`);
    return errors;
  }

  const files = scanDirectory(distDir, ['.html', '.js', '.css']);
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (STITCH_STRING_PATTERN.test(content)) {
      const relPath = path.relative(distDir, filePath);
      errors.push(`[Production Gate] Built file "${relPath}" contains forbidden Stitch reference ("stitch.google.com").`);
    }
  }

  return errors;
}

/**
 * Main validation runner.
 */
export function runProductionValidation({
  env = process.env,
  distDir = path.resolve(__dirname, '../dist'),
} = {}) {
  const envErrors = validateEnvironment(env);
  const distErrors = validateDistOutput(distDir);
  const allErrors = [...envErrors, ...distErrors];

  if (allErrors.length > 0) {
    console.error('\n❌ Production Build Gate Validation FAILED with errors:');
    allErrors.forEach((err) => console.error(`   - ${err}`));
    return { success: false, errors: allErrors };
  }

  console.log('\n✅ Production Build Gate Validation PASSED cleanly!');
  console.log(`   - APP_URL: ${env.APP_URL}`);
  console.log(`   - SITE_URL: ${env.SITE_URL}`);
  console.log(`   - Dist output scanned and verified free of Stitch URLs.`);
  return { success: true, errors: [] };
}

// CLI entrypoint if executed directly
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const result = runProductionValidation();
  if (!result.success) {
    process.exit(1);
  }
}
