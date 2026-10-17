import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');

// Dynamic import for Playwright
let playwright;
try {
  playwright = await import('playwright');
} catch {
  playwright = await import('../../apps/mobile/node_modules/playwright/index.mjs');
}
const { chromium } = playwright;

const APP_PORT = 8085;
const SITE_PORT = 4399; // Isolated port for test
const APP_BASE_URL = `http://localhost:${APP_PORT}`;
const SITE_BASE_URL = `http://localhost:${SITE_PORT}`;

/**
 * MIME types for static site server
 */
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

/**
 * Creates mock local app server that simulates http://localhost:8085
 */
function createMockAppServer() {
  return http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:8085'}`);
    const pathname = parsedUrl.pathname;

    res.writeHead(200, { 'Content-Type': 'text/html' });
    if (pathname === '/login') {
      const mode = parsedUrl.searchParams.get('mode');
      res.end(`<!DOCTYPE html><html><body><h1 id="app-view">App: ${mode === 'register' ? 'Register' : 'Login'}</h1></body></html>`);
    } else if (pathname === '/events') {
      res.end(`<!DOCTYPE html><html><body><h1 id="app-view">App: Events</h1></body></html>`);
    } else if (pathname === '/venues') {
      res.end(`<!DOCTYPE html><html><body><h1 id="app-view">App: Venues</h1></body></html>`);
    } else {
      res.end(`<!DOCTYPE html><html><body><h1 id="app-view">App: Home (${pathname})</h1></body></html>`);
    }
  });
}

/**
 * Creates static file server for apps/site/dist
 */
function createStaticSiteServer() {
  return http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:4399'}`);
    let reqPath = decodeURIComponent(parsedUrl.pathname);

    let filePath = path.join(DIST_DIR, reqPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (!fs.existsSync(filePath) && fs.existsSync(`${filePath}.html`)) {
      filePath = `${filePath}.html`;
    }

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

/**
 * Runs the E2E verification
 */
async function runE2ETests() {
  console.log('===============================================================');
  console.log(' Padel Ghana - Playwright E2E CTA Link Verification');
  console.log('===============================================================');
  console.log(`- App Destination Base: ${APP_BASE_URL}`);
  console.log(`- Site Test Base:        ${SITE_BASE_URL}\n`);

  // Start both servers
  const appServer = createMockAppServer();
  const siteServer = createStaticSiteServer();

  await new Promise((resolve) => appServer.listen(APP_PORT, resolve));
  await new Promise((resolve) => siteServer.listen(SITE_PORT, resolve));

  const browser = await chromium.launch({ headless: true });
  const verifiedButtons = [];
  const errors = [];

  try {
    // -------------------------------------------------------------------------
    // 1. DESKTOP VIEWPORT (1280 x 800)
    // -------------------------------------------------------------------------
    console.log('▶ Testing Viewport: Desktop (1280x800)...');
    const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const desktopPage = await desktopContext.newPage();

    const desktopChecks = [
      {
        pageUrl: `${SITE_BASE_URL}/`,
        selector: '#nav-login-btn',
        label: 'Desktop Header "Log in"',
        expectedPath: '/login',
        expectedSearch: '',
      },
      {
        pageUrl: `${SITE_BASE_URL}/`,
        selector: '#nav-register-btn',
        label: 'Desktop Header "Create account"',
        expectedPath: '/login',
        expectedSearch: 'mode=register',
      },
      {
        pageUrl: `${SITE_BASE_URL}/`,
        selector: '#hero-find-game-btn',
        label: 'Desktop Hero "Find a game"',
        expectedPath: '/events',
        expectedSearch: '',
      },
      {
        pageUrl: `${SITE_BASE_URL}/`,
        selector: '#hero-browse-clubs-btn',
        label: 'Desktop Hero "Browse clubs"',
        expectedPath: '/venues',
        expectedSearch: '',
      },
      {
        pageUrl: `${SITE_BASE_URL}/about`,
        selector: '#about-cta-register',
        label: 'About Page "Create player account"',
        expectedPath: '/login',
        expectedSearch: 'mode=register',
      },
    ];

    for (const check of desktopChecks) {
      await desktopPage.goto(check.pageUrl, { waitUntil: 'domcontentloaded' });
      const button = desktopPage.locator(check.selector);
      await button.waitFor({ state: 'visible', timeout: 5000 });

      // Click and wait for navigation
      await Promise.all([
        desktopPage.waitForNavigation({ timeout: 5000 }),
        button.click(),
      ]);

      const currentUrl = new URL(desktopPage.url());
      const expectedOrigin = new URL(APP_BASE_URL).origin;

      const originMatches = currentUrl.origin === expectedOrigin;
      const pathMatches = currentUrl.pathname === check.expectedPath;
      const searchMatches = check.expectedSearch
        ? currentUrl.search.includes(check.expectedSearch)
        : true;

      if (originMatches && pathMatches && searchMatches) {
        console.log(`  ✓ ${check.label} -> ${currentUrl.href}`);
        verifiedButtons.push({
          viewport: '1280px',
          label: check.label,
          target: currentUrl.href,
        });
      } else {
        const errMsg = `FAILED: ${check.label} navigated to ${currentUrl.href}, expected origin ${expectedOrigin}, path ${check.expectedPath}`;
        console.error(`  ✗ ${errMsg}`);
        errors.push(errMsg);
      }
    }
    await desktopContext.close();

    // -------------------------------------------------------------------------
    // 2. MOBILE VIEWPORT (375 x 667)
    // -------------------------------------------------------------------------
    console.log('\n▶ Testing Viewport: Mobile (375x667)...');
    const mobileContext = await browser.newContext({ viewport: { width: 375, height: 667 } });
    const mobilePage = await mobileContext.newPage();

    // Mobile in-page buttons
    const mobilePageChecks = [
      {
        pageUrl: `${SITE_BASE_URL}/`,
        selector: '#hero-find-game-btn',
        label: 'Mobile Hero "Find a game"',
        expectedPath: '/events',
        expectedSearch: '',
      },
      {
        pageUrl: `${SITE_BASE_URL}/`,
        selector: '#hero-browse-clubs-btn',
        label: 'Mobile Hero "Browse clubs"',
        expectedPath: '/venues',
        expectedSearch: '',
      },
    ];

    for (const check of mobilePageChecks) {
      await mobilePage.goto(check.pageUrl, { waitUntil: 'domcontentloaded' });
      const button = mobilePage.locator(check.selector);
      await button.waitFor({ state: 'visible', timeout: 5000 });

      await Promise.all([
        mobilePage.waitForNavigation({ timeout: 5000 }),
        button.click(),
      ]);

      const currentUrl = new URL(mobilePage.url());
      const expectedOrigin = new URL(APP_BASE_URL).origin;

      if (currentUrl.origin === expectedOrigin && currentUrl.pathname === check.expectedPath) {
        console.log(`  ✓ ${check.label} -> ${currentUrl.href}`);
        verifiedButtons.push({
          viewport: '375px',
          label: check.label,
          target: currentUrl.href,
        });
      } else {
        const errMsg = `FAILED: ${check.label} navigated to ${currentUrl.href}`;
        console.error(`  ✗ ${errMsg}`);
        errors.push(errMsg);
      }
    }

    // Mobile navigation drawer checks
    const mobileDrawerChecks = [
      {
        selector: '#mobile-login-btn',
        label: 'Mobile Drawer "Log in"',
        expectedPath: '/login',
        expectedSearch: '',
      },
      {
        selector: '#mobile-register-btn',
        label: 'Mobile Drawer "Create account"',
        expectedPath: '/login',
        expectedSearch: 'mode=register',
      },
    ];

    for (const check of mobileDrawerChecks) {
      await mobilePage.goto(`${SITE_BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      const toggle = mobilePage.locator('#mobile-menu-toggle');
      await toggle.waitFor({ state: 'visible', timeout: 5000 });
      await toggle.click();

      const button = mobilePage.locator(check.selector);
      await button.waitFor({ state: 'visible', timeout: 5000 });

      await Promise.all([
        mobilePage.waitForNavigation({ timeout: 5000 }),
        button.click(),
      ]);

      const currentUrl = new URL(mobilePage.url());
      const expectedOrigin = new URL(APP_BASE_URL).origin;

      const originMatches = currentUrl.origin === expectedOrigin;
      const pathMatches = currentUrl.pathname === check.expectedPath;
      const searchMatches = check.expectedSearch
        ? currentUrl.search.includes(check.expectedSearch)
        : true;

      if (originMatches && pathMatches && searchMatches) {
        console.log(`  ✓ ${check.label} -> ${currentUrl.href}`);
        verifiedButtons.push({
          viewport: '375px',
          label: check.label,
          target: currentUrl.href,
        });
      } else {
        const errMsg = `FAILED: ${check.label} navigated to ${currentUrl.href}`;
        console.error(`  ✗ ${errMsg}`);
        errors.push(errMsg);
      }
    }
    await mobileContext.close();
  } finally {
    await browser.close();
    await new Promise((resolve) => appServer.close(resolve));
    await new Promise((resolve) => siteServer.close(resolve));
  }

  console.log('\n===============================================================');
  console.log(` Summary: Verified ${verifiedButtons.length} buttons, ${errors.length} errors.`);
  console.log('===============================================================');

  if (errors.length > 0) {
    process.exit(1);
  } else {
    console.log('✅ All CTA destination tests PASSED!\n');
  }
}

runE2ETests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
