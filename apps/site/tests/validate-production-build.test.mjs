import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import {
  validateEnvironment,
  validateDistOutput,
  runProductionValidation,
} from '../scripts/validate-production-build.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Running Production Build Gate Fixture Tests...\n');

// 1. Negative: Empty APP_URL
{
  const errors = validateEnvironment({ APP_URL: '', SITE_URL: 'https://padelghana.com' });
  assert(errors.some((e) => e.includes('APP_URL environment variable is required')), 'Must fail on empty APP_URL');
  console.log('✅ Fixture 1: Fails correctly on empty APP_URL');
}

// 2. Negative: Empty SITE_URL
{
  const errors = validateEnvironment({ APP_URL: 'https://app.padelghana.com', SITE_URL: '' });
  assert(errors.some((e) => e.includes('SITE_URL environment variable is required')), 'Must fail on empty SITE_URL');
  console.log('✅ Fixture 2: Fails correctly on empty SITE_URL');
}

// 3. Negative: Localhost in APP_URL
{
  const errors = validateEnvironment({
    APP_URL: 'http://localhost:8085',
    SITE_URL: 'https://padelghana.com',
  });
  assert(errors.some((e) => e.includes('matches forbidden pattern /localhost/i')), 'Must fail on localhost APP_URL');
  console.log('✅ Fixture 3: Fails correctly on localhost in APP_URL');
}

// 4. Negative: 127.0.0.1 in APP_URL
{
  const errors = validateEnvironment({
    APP_URL: 'http://127.0.0.1:8085',
    SITE_URL: 'https://padelghana.com',
  });
  assert(errors.some((e) => e.includes('matches forbidden pattern /127\\.0\\.0\\.1/i')), 'Must fail on 127.0.0.1 in APP_URL');
  console.log('✅ Fixture 4: Fails correctly on 127.0.0.1 in APP_URL');
}

// 5. Negative: [::1] in APP_URL
{
  const errors = validateEnvironment({
    APP_URL: 'http://[::1]:8085',
    SITE_URL: 'https://padelghana.com',
  });
  assert(errors.some((e) => e.includes('matches forbidden pattern /\\[::1\\]/i')), 'Must fail on [::1] in APP_URL');
  console.log('✅ Fixture 5: Fails correctly on [::1] in APP_URL');
}

// 6. Negative: Stitch in APP_URL
{
  const errors = validateEnvironment({
    APP_URL: 'https://stitch.google.com/projects/18047315422010656209',
    SITE_URL: 'https://padelghana.com',
  });
  assert(errors.some((e) => e.includes('matches forbidden pattern /stitch\\.google\\.com/i')), 'Must fail on stitch in APP_URL');
  console.log('✅ Fixture 6: Fails correctly on stitch.google.com in APP_URL');
}

// 7. Negative: Localhost in SITE_URL
{
  const errors = validateEnvironment({
    APP_URL: 'https://app.padelghana.com',
    SITE_URL: 'http://localhost:4321',
  });
  assert(errors.some((e) => e.includes('matches forbidden pattern /localhost/i')), 'Must fail on localhost in SITE_URL');
  console.log('✅ Fixture 7: Fails correctly on localhost in SITE_URL');
}

// 8. Negative: Stitch in SITE_URL
{
  const errors = validateEnvironment({
    APP_URL: 'https://app.padelghana.com',
    SITE_URL: 'https://stitch.google.com',
  });
  assert(errors.some((e) => e.includes('matches forbidden pattern /stitch\\.google\\.com/i')), 'Must fail on stitch in SITE_URL');
  console.log('✅ Fixture 8: Fails correctly on stitch.google.com in SITE_URL');
}

// 9. Negative: Dist output contains stitch.google.com in an HTML file
{
  const tempFixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pg-dist-fixture-bad-'));
  const badHtml = '<!DOCTYPE html><html><body><a href="https://stitch.google.com/projects/18047315422010656209">Login</a></body></html>';
  fs.writeFileSync(path.join(tempFixtureDir, 'index.html'), badHtml, 'utf-8');

  const errors = validateDistOutput(tempFixtureDir);
  assert(errors.some((e) => e.includes('contains forbidden Stitch reference')), 'Must fail when dist contains stitch.google.com');
  console.log('✅ Fixture 9: Fails correctly when HTML output contains stitch.google.com');

  fs.rmSync(tempFixtureDir, { recursive: true, force: true });
}

// 10. Positive Fixture: Valid production URLs and clean HTML files
{
  const tempFixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pg-dist-fixture-good-'));
  const goodHtml = '<!DOCTYPE html><html><body><a href="https://app.padelghana.com/login">Login</a></body></html>';
  fs.writeFileSync(path.join(tempFixtureDir, 'index.html'), goodHtml, 'utf-8');

  const result = runProductionValidation({
    env: {
      APP_URL: 'https://app.padelghana.com',
      SITE_URL: 'https://padelghana.com',
    },
    distDir: tempFixtureDir,
  });

  assert(result.success === true, 'Valid production environment must pass');
  assert(result.errors.length === 0, 'No errors expected for clean production fixture');
  console.log('✅ Fixture 10: Passes cleanly with valid production environment and clean HTML');

  fs.rmSync(tempFixtureDir, { recursive: true, force: true });
}

console.log('\nAll 10 production build gate fixture tests passed successfully!\n');
