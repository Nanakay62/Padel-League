const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8089';
const SCREENSHOT_DIR = path.resolve(__dirname, '../../../docs/screenshots/slice_a');
const ARTIFACTS_DIR = 'C:\\Users\\nanak\\.gemini\\antigravity-ide\\brain\\5ee3dc19-f669-4b78-afd3-a61947c5e5c7';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function captureLoginForViewport(browser, width, height, suffix) {
  console.log(`\nCapturing Login Steps for ${suffix} (${width}x${height})...`);
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();

  // Mock /auth/otp/request so we don't depend on live backend or SMS for visual capture
  await page.route('**/auth/otp/request', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'OTP sent successfully',
        expires_at: new Date(Date.now() + 300000).toISOString(),
        expires_in_seconds: 300,
        resend_cooldown_seconds: 30,
      }),
    });
  });

  // Navigate to /login
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('text=Send Login Code', { timeout: 15000 });

  // Step 1: Capture Phone Step
  const step1Path = path.join(SCREENSHOT_DIR, `login-step1-phone-${suffix}.png`);
  await page.screenshot({ path: step1Path, fullPage: true });
  fs.copyFileSync(step1Path, path.join(ARTIFACTS_DIR, `login-step1-phone-${suffix}.png`));
  console.log(`  ✓ Saved Step 1 (Phone Input) screenshot: ${step1Path}`);

  // Fill in phone number and click send
  const phoneInput = page.getByPlaceholder(/024 123 4567/i).or(page.locator('input[type="tel"], input')).first();
  await phoneInput.fill('0244123456');
  await page.waitForTimeout(200);

  const sendBtn = page.getByText('Send Login Code').first();
  await sendBtn.click();
  await page.waitForTimeout(800);

  // Step 2: Capture OTP Step
  await page.waitForSelector('text=Enter 6-Digit Code', { timeout: 10000 });
  const step2Path = path.join(SCREENSHOT_DIR, `login-step2-otp-${suffix}.png`);
  await page.screenshot({ path: step2Path, fullPage: true });
  fs.copyFileSync(step2Path, path.join(ARTIFACTS_DIR, `login-step2-otp-${suffix}.png`));
  console.log(`  ✓ Saved Step 2 (OTP Input) screenshot: ${step2Path}`);

  await context.close();
}

async function main() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  try {
    await captureLoginForViewport(browser, 1280, 800, '1280');
    await captureLoginForViewport(browser, 375, 812, '375');
    console.log('\nAll login screenshots captured successfully!');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Failed to capture login screenshots:', err);
  process.exit(1);
});
