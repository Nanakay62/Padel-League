const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8089';
const SCREENSHOT_DIR = path.resolve(__dirname, '../../../docs/screenshots');
const ARTIFACTS_DIR = 'C:\\Users\\nanak\\.gemini\\antigravity-ide\\brain\\5ee3dc19-f669-4b78-afd3-a61947c5e5c7';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function captureEmailAuth(browser, width, height, suffix) {
  console.log(`\nCapturing Email Auth Tab for ${suffix} (${width}x${height})...`);
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();

  // Navigate to /login
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  // Click on the Email tab
  const emailTab = page.locator('[data-testid="tab-email"]').or(page.getByText(/Email/i)).first();
  await emailTab.click();
  await page.waitForTimeout(500);

  // Verify email input is visible
  await page.waitForSelector('[data-testid="email-input"]', { timeout: 10000 });

  // Capture Email Sign-In view
  const emailLoginPath = path.join(SCREENSHOT_DIR, `email_auth_${suffix}.png`);
  await page.screenshot({ path: emailLoginPath, fullPage: true });
  fs.copyFileSync(emailLoginPath, path.join(ARTIFACTS_DIR, `email_auth_${suffix}.png`));
  console.log(`  ✓ Saved Email Auth screenshot (${suffix}): ${emailLoginPath}`);

  // Switch to Register mode
  const registerSwitch = page.locator('[data-testid="switch-to-register"]').or(page.getByText(/Register/i)).first();
  if (await registerSwitch.isVisible()) {
    await registerSwitch.click();
    await page.waitForTimeout(500);
    const registerPath = path.join(SCREENSHOT_DIR, `email_register_${suffix}.png`);
    await page.screenshot({ path: registerPath, fullPage: true });
    fs.copyFileSync(registerPath, path.join(ARTIFACTS_DIR, `email_register_${suffix}.png`));
    console.log(`  ✓ Saved Email Register screenshot (${suffix}): ${registerPath}`);
  }

  await context.close();
}

async function main() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  try {
    await captureEmailAuth(browser, 375, 812, '375');
    await captureEmailAuth(browser, 1280, 800, '1280');
    console.log('\nAll Email Auth screenshots captured successfully!');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Failed to capture Email Auth screenshots:', err);
  process.exit(1);
});
