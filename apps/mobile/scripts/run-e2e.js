/**
 * Ghana Padel Platform - End-to-End Navigation & Hit-Test Verification Script
 * Uses Playwright to test all buttons, elementFromPoint, URL routing, and layout responsiveness
 * at 1280px (Desktop) and 375px (Mobile).
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8086';
const SCREENSHOT_DIR = path.resolve(__dirname, '../../../docs/screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runHitTest(page, selector, label) {
  const loc = page.locator(selector).first();
  await loc.waitFor({ state: 'attached', timeout: 5000 });
  await loc.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'center' }));
  await page.waitForTimeout(100);
  const box = await loc.boundingBox();
  if (!box) {
    throw new Error(`Element ${selector} (${label}) has no bounding box`);
  }
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  const hitResult = await page.evaluate(
    ({ cx, cy, selector }) => {
      const targetEl = document.querySelector(selector);
      const topEl = document.elementFromPoint(cx, cy);
      if (!topEl || !targetEl) {
        return {
          pass: false,
          topTag: topEl ? topEl.tagName : 'null',
          topClass: topEl ? topEl.className : '',
        };
      }
      const isTargetOrDescendant =
        targetEl === topEl ||
        targetEl.contains(topEl) ||
        topEl.contains(targetEl);
      return {
        pass: isTargetOrDescendant,
        topTag: topEl.tagName,
        topClass: topEl.className,
      };
    },
    { cx, cy, selector }
  );

  return { box, cx, cy, hitResult };
}

async function runE2E() {
  console.log(`Starting Playwright E2E verification against: ${BASE_URL}\n`);

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  const results = [];

  // ==========================================
  // 1. DESKTOP RUN (1280 x 800)
  // ==========================================
  console.log('--- RUNNING DESKTOP TESTS (1280 x 800) ---');
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(BASE_URL, { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(1000);

  // Capture Desktop Screenshot
  const desktopScreenshotPath = path.join(SCREENSHOT_DIR, 'desktop-1280.png');
  await desktopPage.screenshot({ path: desktopScreenshotPath, fullPage: true });
  console.log(`Saved desktop screenshot to ${desktopScreenshotPath}`);

  const desktopControls = [
    // Top bar
    { selector: '[data-testid="topbar-search-btn"]', label: 'Top Bar Search', targetUrl: '/search', content: 'Search' },
    { selector: '[data-testid="topbar-notifications-btn"]', label: 'Top Bar Notifications', targetUrl: '/notifications', content: 'Notifications' },
    { selector: '[data-testid="topbar-profile-btn"]', label: 'Top Bar Profile', targetUrl: '/profile', content: 'Profile' },
    // Sidebar
    { selector: '[data-testid="sidebar-home-link"]', label: 'Sidebar Home', targetUrl: '/', content: 'Padel' },
    { selector: '[data-testid="sidebar-play-link"]', label: 'Sidebar Play', targetUrl: '/play', content: 'Events' },
    { selector: '[data-testid="sidebar-leagues-link"]', label: 'Sidebar Leagues', targetUrl: '/leagues', content: 'Box' },
    { selector: '[data-testid="sidebar-community-link"]', label: 'Sidebar Community', targetUrl: '/community', content: 'Community' },
    { selector: '[data-testid="sidebar-venues-link"]', label: 'Sidebar Venues', targetUrl: '/venues', content: 'Accra' },
    { selector: '[data-testid="sidebar-credits-link"]', label: 'Sidebar Credits', targetUrl: '/credits', content: 'Credits' },
    { selector: '[data-testid="sidebar-profile-link"]', label: 'Sidebar Profile', targetUrl: '/profile', content: 'Profile' },
    { selector: '[data-testid="sidebar-create-event-btn"]', label: 'Sidebar Quick: Create Event', targetUrl: '/events/create', content: 'Host' },
    { selector: '[data-testid="sidebar-find-fourth-btn"]', label: 'Sidebar Quick: Find a Fourth', targetUrl: '/partners', content: 'Kojo' },
    { selector: '[data-testid="sidebar-join-league-btn"]', label: 'Sidebar Quick: Join League', targetUrl: '/leagues', content: 'Box' },
    { selector: '[data-testid="sidebar-view-venues-btn"]', label: 'Sidebar Quick: View Venues', targetUrl: '/venues', content: 'Accra' },
    // Home Page Elements
    { selector: '[data-testid="home-credit-balance-btn"]', label: 'Home Credit Balance Badge', targetUrl: '/credits', content: 'Credits' },
    { selector: '[data-testid="home-view-session-btn"]', label: 'Home Next Game View Session', targetUrl: '/events/evt-001', content: 'Thursday Americano' },
    { selector: '[data-testid="home-courtside-live-btn"]', label: 'Home Next Game Courtside Live', targetUrl: '/events/evt-001/live', content: 'Courtside' },
    { selector: '[data-testid="home-my-rating-btn"]', label: 'Home Rating View Details', targetUrl: '/ratings', content: 'Rating' },
    { selector: '[data-testid="home-see-all-sessions-btn"]', label: 'Home Play Near You See All', targetUrl: '/play', content: 'Events' },
    { selector: '[data-testid="home-join-session-evt-001"]', label: 'Home Play Near You Join Evt 1', targetUrl: '/events/evt-001', content: 'Thursday Americano' },
    { selector: '[data-testid="home-see-all-leagues-btn"]', label: 'Home Upcoming Leagues See All', targetUrl: '/leagues', content: 'Box' },
    { selector: '[data-testid="home-league-lg-001"]', label: 'Home League Card lg-001', targetUrl: '/leagues', content: 'Box' },
    { selector: '[data-testid="home-find-events-btn"]', label: 'Home Quick Action Find Events', targetUrl: '/play', content: 'Events' },
    { selector: '[data-testid="home-partner-finder-btn"]', label: 'Home Quick Action Find a Fourth', targetUrl: '/partners', content: 'Kojo' },
    { selector: '[data-testid="home-box-leagues-btn"]', label: 'Home Quick Action Box Leagues', targetUrl: '/leagues', content: 'Box' },
    { selector: '[data-testid="home-venues-btn"]', label: 'Home Quick Action Venues', targetUrl: '/venues', content: 'Accra' },
    { selector: '[data-testid="home-create-event-btn"]', label: 'Home Quick Action Create Event', targetUrl: '/events/create', content: 'Host' },
    { selector: '[data-testid="home-settings-btn"]', label: 'Home Quick Action Settings', targetUrl: '/settings', content: 'Settings' },
    { selector: '[data-testid="home-explore-venues-banner-btn"]', label: 'Home Community Banner Explore', targetUrl: '/venues', content: 'Accra' },
  ];

  for (const ctrl of desktopControls) {
    try {
      // Return to home
      await desktopPage.goto(BASE_URL, { waitUntil: 'networkidle' });
      await desktopPage.waitForTimeout(400);

      const hit = await runHitTest(desktopPage, ctrl.selector, ctrl.label);
      if (!hit.hitResult.pass) {
        throw new Error(`Hit-test failed! Element covered by ${hit.hitResult.topTag}.${hit.hitResult.topClass}`);
      }

      await desktopPage.locator(ctrl.selector).first().click();
      await desktopPage.waitForTimeout(600);

      const currentUrl = desktopPage.url();
      const pageText = await desktopPage.innerText('body');
      const urlMatches = currentUrl.includes(ctrl.targetUrl);
      const textMatches = pageText.includes(ctrl.content);

      if (!urlMatches) {
        throw new Error(`URL mismatch: expected to include ${ctrl.targetUrl}, got ${currentUrl}`);
      }

      results.push({
        viewport: '1280px (Desktop)',
        element: ctrl.label,
        selector: ctrl.selector,
        targetUrl: ctrl.targetUrl,
        hitTest: 'PASS (Uncovered)',
        status: 'WORKS',
      });
      console.log(`  ✓ [1280px] ${ctrl.label} -> ${currentUrl}`);
    } catch (err) {
      results.push({
        viewport: '1280px (Desktop)',
        element: ctrl.label,
        selector: ctrl.selector,
        targetUrl: ctrl.targetUrl,
        hitTest: 'FAIL',
        status: `FAILED: ${err.message}`,
      });
      console.error(`  ✗ [1280px] ${ctrl.label}: ${err.message}`);
    }
  }

  await desktopContext.close();

  // ==========================================
  // 2. MOBILE RUN (375 x 812)
  // ==========================================
  console.log('\n--- RUNNING MOBILE TESTS (375 x 812) ---');
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);

  // Capture Mobile Screenshot
  const mobileScreenshotPath = path.join(SCREENSHOT_DIR, 'mobile-375.png');
  await mobilePage.screenshot({ path: mobileScreenshotPath, fullPage: true });
  console.log(`Saved mobile screenshot to ${mobileScreenshotPath}`);

  const mobileControls = [
    // Bottom Tabs
    { selector: '[data-testid="tab-home-btn"]', label: 'Bottom Tab Home', targetUrl: '/', content: 'Padel' },
    { selector: '[data-testid="tab-play-btn"]', label: 'Bottom Tab Play', targetUrl: '/play', content: 'Events' },
    { selector: '[data-testid="tab-leagues-btn"]', label: 'Bottom Tab Leagues', targetUrl: '/leagues', content: 'Box' },
    { selector: '[data-testid="tab-community-btn"]', label: 'Bottom Tab Community', targetUrl: '/community', content: 'Community' },
    { selector: '[data-testid="tab-profile-btn"]', label: 'Bottom Tab Profile', targetUrl: '/profile', content: 'Profile' },
    // Home Page Elements
    { selector: '[data-testid="home-credit-balance-btn"]', label: 'Home Credit Balance Badge', targetUrl: '/credits', content: 'Credits' },
    { selector: '[data-testid="home-view-session-btn"]', label: 'Home Next Game View Session', targetUrl: '/events/evt-001', content: 'Thursday Americano' },
    { selector: '[data-testid="home-courtside-live-btn"]', label: 'Home Next Game Courtside Live', targetUrl: '/events/evt-001/live', content: 'Courtside' },
    { selector: '[data-testid="home-my-rating-btn"]', label: 'Home Rating View Details', targetUrl: '/ratings', content: 'Rating' },
    { selector: '[data-testid="home-see-all-sessions-btn"]', label: 'Home Play Near You See All', targetUrl: '/play', content: 'Events' },
    { selector: '[data-testid="home-join-session-evt-001"]', label: 'Home Play Near You Join Evt 1', targetUrl: '/events/evt-001', content: 'Thursday Americano' },
    { selector: '[data-testid="home-see-all-leagues-btn"]', label: 'Home Upcoming Leagues See All', targetUrl: '/leagues', content: 'Box' },
    { selector: '[data-testid="home-league-lg-001"]', label: 'Home League Card lg-001', targetUrl: '/leagues', content: 'Box' },
    { selector: '[data-testid="home-find-events-btn"]', label: 'Home Quick Action Find Events', targetUrl: '/play', content: 'Events' },
    { selector: '[data-testid="home-partner-finder-btn"]', label: 'Home Quick Action Find a Fourth', targetUrl: '/partners', content: 'Kojo' },
    { selector: '[data-testid="home-box-leagues-btn"]', label: 'Home Quick Action Box Leagues', targetUrl: '/leagues', content: 'Box' },
    { selector: '[data-testid="home-venues-btn"]', label: 'Home Quick Action Venues', targetUrl: '/venues', content: 'Accra' },
    { selector: '[data-testid="home-create-event-btn"]', label: 'Home Quick Action Create Event', targetUrl: '/events/create', content: 'Host' },
    { selector: '[data-testid="home-settings-btn"]', label: 'Home Quick Action Settings', targetUrl: '/settings', content: 'Settings' },
    { selector: '[data-testid="home-explore-venues-banner-btn"]', label: 'Home Community Banner Explore', targetUrl: '/venues', content: 'Accra' },
  ];

  for (const ctrl of mobileControls) {
    try {
      await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle' });
      await mobilePage.waitForTimeout(400);

      const hit = await runHitTest(mobilePage, ctrl.selector, ctrl.label);
      if (!hit.hitResult.pass) {
        throw new Error(`Hit-test failed! Element covered by ${hit.hitResult.topTag}.${hit.hitResult.topClass}`);
      }

      await mobilePage.locator(ctrl.selector).first().click();
      await mobilePage.waitForTimeout(600);

      const currentUrl = mobilePage.url();
      const pageText = await mobilePage.innerText('body');
      const urlMatches = currentUrl.includes(ctrl.targetUrl);

      if (!urlMatches) {
        throw new Error(`URL mismatch: expected to include ${ctrl.targetUrl}, got ${currentUrl}`);
      }

      results.push({
        viewport: '375px (Mobile)',
        element: ctrl.label,
        selector: ctrl.selector,
        targetUrl: ctrl.targetUrl,
        hitTest: 'PASS (Uncovered)',
        status: 'WORKS',
      });
      console.log(`  ✓ [375px] ${ctrl.label} -> ${currentUrl}`);
    } catch (err) {
      results.push({
        viewport: '375px (Mobile)',
        element: ctrl.label,
        selector: ctrl.selector,
        targetUrl: ctrl.targetUrl,
        hitTest: 'FAIL',
        status: `FAILED: ${err.message}`,
      });
      console.error(`  ✗ [375px] ${ctrl.label}: ${err.message}`);
    }
  }

  await mobileContext.close();
  await browser.close();

  // Output formatted JSON summary
  const summaryFile = path.join(__dirname, 'e2e-results.json');
  fs.writeFileSync(summaryFile, JSON.stringify(results, null, 2));
  console.log(`\nSaved E2E results to ${summaryFile}`);

  const failures = results.filter((r) => r.status !== 'WORKS');
  if (failures.length > 0) {
    console.error(`\n${failures.length} controls failed verification!`);
    process.exit(1);
  } else {
    console.log(`\nAll ${results.length} controls passed hit-test and navigation verification!`);
  }
}

runE2E().catch((err) => {
  console.error('Fatal E2E runner error:', err);
  process.exit(1);
});
