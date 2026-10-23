const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'http://localhost:8086';
const ARTIFACT_DIR = 'C:\\Users\\nanak\\.gemini\\antigravity-ide\\brain\\ff7b8476-3fd6-4f69-a24d-12380daf1801';

async function capture() {
  console.log('Capturing detailed scrolled screenshots from ' + BASE_URL);
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
  });
  const page = await mobileContext.newPage();

  // 1. Home Top
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_mobile_home_hero_and_next_game.png') });
  console.log('Captured 01_mobile_home_hero_and_next_game.png');

  // 2. Scroll to Sessions & Day Picker
  await page.evaluate(() => {
    const scroller = document.querySelector('.shell-right-col') || window;
    scroller.scrollTo({ top: 520, behavior: 'instant' });
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_mobile_home_day_picker_and_sessions.png') });
  console.log('Captured 02_mobile_home_day_picker_and_sessions.png');

  // 3. Scroll to Leagues & Quick Actions
  await page.evaluate(() => {
    const scroller = document.querySelector('.shell-right-col') || window;
    scroller.scrollTo({ top: 1200, behavior: 'instant' });
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_mobile_home_leagues_and_quick_actions.png') });
  console.log('Captured 03_mobile_home_leagues_and_quick_actions.png');

  // 4. Events Discovery Screen
  await page.goto(BASE_URL + '/events', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_mobile_events_day_picker_and_rosters.png') });
  console.log('Captured 04_mobile_events_day_picker_and_rosters.png');

  await mobileContext.close();
  await browser.close();
  console.log('All detailed screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
