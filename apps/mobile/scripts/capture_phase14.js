const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8085';
const SCREENSHOT_DIR = path.resolve(__dirname, '../../../docs/screenshots/phase14');
const ARTIFACTS_DIR = 'C:\\Users\\nanak\\.gemini\\antigravity-ide\\brain\\5ee3dc19-f669-4b78-afd3-a61947c5e5c7';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function navigateTo(page, targetPath) {
  await page.evaluate((target) => {
    window.history.pushState({}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, targetPath);
  await page.waitForTimeout(1000);
}

async function run() {
  console.log(`Starting Phase 14 screenshots from ${BASE_URL}...`);
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  // Desktop context 1280x800
  const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(BASE_URL, { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(1000);

  // Mobile context 375x812
  const mobileContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);

  // 1. Venue Page: /venues/v1
  console.log('Capturing /venues/v1 (Desktop 1280px)...');
  await navigateTo(desktopPage, '/venues/v1');
  const venueDesktopPath = path.join(SCREENSHOT_DIR, 'venue-desktop.png');
  await desktopPage.screenshot({ path: venueDesktopPath, fullPage: false });
  fs.copyFileSync(venueDesktopPath, path.join(ARTIFACTS_DIR, 'venue-detail-desktop-1280.png'));

  console.log('Capturing /venues/v1 (Mobile 375px)...');
  await navigateTo(mobilePage, '/venues/v1');
  const venueMobilePath = path.join(SCREENSHOT_DIR, 'venue-mobile.png');
  await mobilePage.screenshot({ path: venueMobilePath, fullPage: false });
  fs.copyFileSync(venueMobilePath, path.join(ARTIFACTS_DIR, 'venue-detail-mobile-375.png'));

  // 2. Court Page: /venues/v1/courts/c1
  console.log('Capturing /venues/v1/courts/c1 (Desktop 1280px)...');
  await navigateTo(desktopPage, '/venues/v1/courts/c1');
  const courtDesktopPath = path.join(SCREENSHOT_DIR, 'court-desktop.png');
  await desktopPage.screenshot({ path: courtDesktopPath, fullPage: false });
  fs.copyFileSync(courtDesktopPath, path.join(ARTIFACTS_DIR, 'court-detail-desktop-1280.png'));

  console.log('Capturing /venues/v1/courts/c1 (Mobile 375px)...');
  await navigateTo(mobilePage, '/venues/v1/courts/c1');
  const courtMobilePath = path.join(SCREENSHOT_DIR, 'court-mobile.png');
  await mobilePage.screenshot({ path: courtMobilePath, fullPage: false });
  fs.copyFileSync(courtMobilePath, path.join(ARTIFACTS_DIR, 'court-detail-mobile-375.png'));

  await desktopContext.close();
  await mobileContext.close();
  await browser.close();

  console.log('Screenshots saved successfully!');
}

run().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
