const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:8081';
const ARTIFACT_DIR = 'C:/Users/nanak/.gemini/antigravity-ide/brain/68042e59-18c0-4ecc-ba21-ad629c7b0b54';

const ROUTES = [
  { path: '/', name: 'home' },
  { path: '/events', name: 'play_events' },
  { path: '/events/evt-001', name: 'event_detail' },
  { path: '/credits', name: 'credits' },
  { path: '/venues', name: 'venues' },
  { path: '/leagues', name: 'leagues' },
  { path: '/community', name: 'community' },
  { path: '/profile', name: 'profile' },
  { path: '/events/create', name: 'create_event' },
];

async function capture() {
  console.log('Launching Chromium with Playwright (channel: chrome)...');
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch {
    console.log('Chrome channel failed, trying msedge...');
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }

  const viewports = [
    { label: 'desktop', width: 1360, height: 900 },
    { label: 'mobile', width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    console.log(`\n--- Capturing ${vp.label} (${vp.width}x${vp.height}) ---`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    for (const route of ROUTES) {
      const url = `${BASE_URL}${route.path}`;
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(1000); // let animations settle

        const filename = `court_chalk_${route.name}_${vp.label}.png`;
        const filePath = path.join(ARTIFACT_DIR, filename);

        await page.screenshot({ path: filePath, fullPage: false });
        console.log(`[PASS] ${vp.label} ${route.name} -> ${filename}`);
      } catch (err) {
        console.error(`[FAIL] ${vp.label} ${route.name}: ${err.message}`);
      }
    }
    await context.close();
  }

  await browser.close();
  console.log('\nAll captures completed successfully.');
}

capture().catch((e) => {
  console.error('Fatal capture error:', e);
  process.exit(1);
});
