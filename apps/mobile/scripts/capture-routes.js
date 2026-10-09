const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8086';
const ROUTES_DIR = path.resolve(__dirname, '../../../docs/screenshots/routes');

if (!fs.existsSync(ROUTES_DIR)) {
  fs.mkdirSync(ROUTES_DIR, { recursive: true });
}

const routes = [
  { name: 'home', path: '/', title: 'Home (Master Screen)' },
  { name: 'play', path: '/play', title: 'Play / Events List' },
  { name: 'leagues', path: '/leagues', title: 'Leagues' },
  { name: 'community', path: '/community', title: 'Community' },
  { name: 'venues', path: '/venues', title: 'Venues Directory' },
  { name: 'credits', path: '/credits', title: 'Credits Balance' },
  { name: 'profile', path: '/profile', title: 'Player Profile' },
  { name: 'search', path: '/search', title: 'Search' },
  { name: 'notifications', path: '/notifications', title: 'Notifications' },
  { name: 'event-detail', path: '/events/evt-001', title: 'Event Details (Thursday Americano)' },
  { name: 'live-scoring', path: '/events/evt-001/live', title: 'Courtside Live Scoring (Dark Theme)' },
  { name: 'live-display', path: '/events/evt-001/display', title: 'Live Court Display' },
  { name: 'event-create', path: '/events/create', title: 'Create Event' },
  { name: 'ratings', path: '/ratings', title: 'Rating & History' },
  { name: 'partners', path: '/partners', title: 'Find a Fourth / Partners' },
  { name: 'settings', path: '/settings', title: 'Settings & Performance' },
];

async function navigateTo(page, path) {
  await page.evaluate((target) => {
    window.history.pushState({}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
  await page.waitForTimeout(600);
}

async function capture() {
  console.log(`Starting Route Capture from ${BASE_URL}...`);
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(BASE_URL, { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(800);

  const mobileContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(800);

  for (const r of routes) {
    console.log(`Capturing route: ${r.title} (${r.path})`);

    // Desktop
    await navigateTo(desktopPage, r.path);
    const dPath = path.join(ROUTES_DIR, `${r.name}-desktop.png`);
    await desktopPage.screenshot({ path: dPath, fullPage: false });

    // Mobile
    await navigateTo(mobilePage, r.path);
    const mPath = path.join(ROUTES_DIR, `${r.name}-mobile.png`);
    await mobilePage.screenshot({ path: mPath, fullPage: false });
  }

  await desktopContext.close();
  await mobileContext.close();
  await browser.close();

  // Generate HTML Contact Sheet
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Ghana Padel Platform - Route Contact Sheet</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #F6F6F4; color: #14181A; margin: 0; padding: 24px; }
    h1 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
    p.lead { color: #5F676B; font-size: 14px; margin-bottom: 24px; }
    .grid { display: flex; flex-direction: column; gap: 32px; }
    .card { background: #FFFFFF; border: 1px solid #E7E7E3; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
    .card-title { font-size: 16px; font-weight: 600; margin: 0 0 16px 0; display: flex; align-items: center; justify-content: space-between; }
    .badge { font-size: 12px; padding: 4px 8px; border-radius: 999px; background: #E7E7E3; color: #14181A; font-weight: 500; }
    .badge-dark { background: #14181A; color: #00C853; }
    .row { display: flex; gap: 20px; align-items: flex-start; }
    .desktop-view { flex: 2; border: 1px solid #E7E7E3; border-radius: 8px; overflow: hidden; background: #FFF; }
    .mobile-view { flex: 1; max-width: 375px; border: 1px solid #E7E7E3; border-radius: 8px; overflow: hidden; background: #FFF; }
    img { width: 100%; display: block; }
  </style>
</head>
<body>
  <h1>Ghana Padel Platform - Route Contact Sheet</h1>
  <p class="lead">Design Direction: Flat, Matte, Calm "Mica" (#F6F6F4) across all screens. Dark Theme strictly isolated to Live Scoring.</p>
  <div class="grid">
`;

  for (const r of routes) {
    const isDark = r.name === 'live-scoring';
    html += `    <div class="card">
      <div class="card-title">
        <span>${r.title} <code>${r.path}</code></span>
        <span class="badge ${isDark ? 'badge-dark' : ''}">${isDark ? 'Dark Theme (Live Scoring Only)' : 'Light Mica Theme'}</span>
      </div>
      <div class="row">
        <div class="desktop-view">
          <img src="${r.name}-desktop.png" alt="${r.title} Desktop" loading="lazy" />
        </div>
        <div class="mobile-view">
          <img src="${r.name}-mobile.png" alt="${r.title} Mobile" loading="lazy" />
        </div>
      </div>
    </div>\n`;
  }

  html += `  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(ROUTES_DIR, 'index.html'), html, 'utf-8');

  // Also write README.md for easy markdown referencing
  let md = `# Route Contact Sheet\n\nGenerated for 16 routes at Desktop (1280px) and Mobile (375px).\n\n| Route | Title | Theme | Desktop | Mobile |\n|---|---|---|---|---|\n`;
  for (const r of routes) {
    const theme = r.name === 'live-scoring' ? 'Dark (Live Scoring)' : 'Light Mica';
    md += `| \`${r.path}\` | ${r.title} | ${theme} | [Desktop](${r.name}-desktop.png) | [Mobile](${r.name}-mobile.png) |\n`;
  }
  fs.writeFileSync(path.join(ROUTES_DIR, 'README.md'), md, 'utf-8');

  console.log(`\nSuccessfully captured all routes to ${ROUTES_DIR}!`);
}

capture().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
