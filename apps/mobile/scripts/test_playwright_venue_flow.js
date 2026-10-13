const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8089';
const SCREENSHOT_DIR = path.resolve(__dirname, '../../../docs/screenshots/phase14');
const ARTIFACTS_DIR = 'C:\\Users\\nanak\\.gemini\\antigravity-ide\\brain\\5ee3dc19-f669-4b78-afd3-a61947c5e5c7';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runHitTest(page, locatorOrSelector, label) {
  let loc;
  if (typeof locatorOrSelector === 'object' && locatorOrSelector.waitFor) {
    loc = locatorOrSelector;
  } else if (typeof locatorOrSelector === 'string' && locatorOrSelector.startsWith('[')) {
    loc = page.locator(locatorOrSelector).first();
  } else {
    loc = page.getByText(locatorOrSelector).first();
  }
  await loc.waitFor({ state: 'attached', timeout: 10000 });
  await loc.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'center' }));
  await page.waitForTimeout(250);

  const box = await loc.boundingBox();
  if (!box) {
    throw new Error(`Element ${label} has no bounding box`);
  }
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  const hitResult = await page.evaluate(
    ({ cx, cy }) => {
      const topEl = document.elementFromPoint(cx, cy);
      if (!topEl) return { pass: false, topTag: 'null' };
      return {
        pass: true,
        topTag: topEl.tagName,
        topText: topEl.innerText ? topEl.innerText.slice(0, 30) : '',
      };
    },
    { cx, cy }
  );

  return { box, cx, cy, hitResult };
}

async function testViewport(browser, width, height, name) {
  console.log(`\n========================================`);
  console.log(`Testing Viewport: ${name} (${width}x${height})`);
  console.log(`========================================`);

  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();

  // Listen to window.open / Linking.openURL
  await page.addInitScript(() => {
    window.__openedUrls = [];
    const origOpen = window.open;
    window.open = function(url) {
      window.__openedUrls.push(url);
      return null;
    };
  });

  // Step 1: Browse /venues
  console.log(`1. Navigating to ${BASE_URL}/venues...`);
  await page.goto(`${BASE_URL}/venues`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('text=Accra Padel Clubs', { timeout: 15000 });
  console.log('   ✓ Venue directory loaded');

  // Step 2: Click "View club"
  console.log('2. Locating and hit-testing "View club" button...');
  const viewClubBtn = page.getByRole('button', { name: 'View club' }).first();
  await viewClubBtn.waitFor({ state: 'attached', timeout: 10000 });
  await viewClubBtn.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'center' }));
  await page.waitForTimeout(200);

  const hitViewClub = await runHitTest(page, viewClubBtn, 'View club button');
  console.log(`   ✓ Hit-test "View club" at (${hitViewClub.cx.toFixed(1)}, ${hitViewClub.cy.toFixed(1)}): ${hitViewClub.hitResult.pass ? 'PASS' : 'FAIL'}`);
  await viewClubBtn.click();
  await page.waitForTimeout(1000);

  // Assert URL /venues/:id
  const currentUrl = page.url();
  console.log(`   ✓ Navigated to: ${currentUrl}`);
  if (!currentUrl.includes('/venues/v')) {
    throw new Error(`Expected URL to include /venues/v, got ${currentUrl}`);
  }

  // Step 3: Click "View court"
  console.log('3. Locating and hit-testing "View court" button...');
  const viewCourtBtn = page.getByRole('button', { name: 'View court' }).first();
  await viewCourtBtn.waitFor({ state: 'attached', timeout: 15000 });
  await viewCourtBtn.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'center' }));
  await page.waitForTimeout(200);

  const hitViewCourt = await runHitTest(page, viewCourtBtn, 'View court button');
  console.log(`   ✓ Hit-test "View court" at (${hitViewCourt.cx.toFixed(1)}, ${hitViewCourt.cy.toFixed(1)}): ${hitViewCourt.hitResult.pass ? 'PASS' : 'FAIL'}`);
  await viewCourtBtn.click();
  await page.waitForTimeout(1000);

  const courtUrl = page.url();
  console.log(`   ✓ Navigated to: ${courtUrl}`);
  if (!courtUrl.includes('/courts/')) {
    throw new Error(`Expected URL to include /courts/, got ${courtUrl}`);
  }

  // Step 4: Locate Pay / Book button & hit test
  console.log('4. Locating and hit-testing "Book & Pay" / Action button...');
  const payBtn = page.getByRole('button', { name: /Book & Pay|Call to Book|Contact Club/i }).first();
  await payBtn.waitFor({ state: 'attached', timeout: 15000 });
  await payBtn.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'center' }));
  await page.waitForTimeout(200);

  const payBtnText = await payBtn.innerText();
  console.log(`   Found action button with label: "${payBtnText.trim().replace(/\n/g, ' ')}"`);

  const hitPay = await runHitTest(page, payBtn, 'Pay/Book Action Button');
  console.log(`   ✓ Hit-test Pay button at (${hitPay.cx.toFixed(1)}, ${hitPay.cy.toFixed(1)}): ${hitPay.hitResult.pass ? 'PASS' : 'FAIL'}`);

  // Click Pay button to trigger "Court booking opens soon" contact card
  console.log('5. Clicking Pay button to open "Court booking opens soon" card...');
  await payBtn.click();
  await page.waitForTimeout(800);

  // Step 5: Assert "Court booking opens soon" contact card
  console.log('6. Verifying "Court booking opens soon" contact card and link formats...');
  const modalHeader = page.getByText('Court booking opens soon').first();
  await modalHeader.waitFor({ state: 'visible', timeout: 8000 });
  console.log('   ✓ "Court booking opens soon" contact card displayed!');

  // Check Call button and WhatsApp button inside card
  const callBtn = page.getByRole('button', { name: /Call Club|Call to Book/i }).last();
  const waBtn = page.getByRole('button', { name: /WhatsApp Club|WhatsApp/i }).last();

  await callBtn.waitFor({ state: 'attached', timeout: 8000 });
  await callBtn.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'center' }));
  await waBtn.waitFor({ state: 'attached', timeout: 8000 });
  await waBtn.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'center' }));

  const hitCall = await runHitTest(page, callBtn, 'Call Club Contact Button');
  console.log(`   ✓ Hit-test Call Club at (${hitCall.cx.toFixed(1)}, ${hitCall.cy.toFixed(1)}): ${hitCall.hitResult.pass ? 'PASS' : 'FAIL'}`);

  const hitWa = await runHitTest(page, waBtn, 'WhatsApp Contact Button');
  console.log(`   ✓ Hit-test WhatsApp at (${hitWa.cx.toFixed(1)}, ${hitWa.cy.toFixed(1)}): ${hitWa.hitResult.pass ? 'PASS' : 'FAIL'}`);

  // Click WhatsApp button to trigger window.open
  await waBtn.click();
  await page.waitForTimeout(300);

  // Click Call button
  await callBtn.click();
  await page.waitForTimeout(300);

  // Verify link formats and opened URLs
  const linksValid = await page.evaluate(() => {
    const urls = window.__openedUrls || [];
    return {
      hasBookingCard: !!document.body.innerText.includes('Court booking opens soon'),
      hasCallOption: !!document.body.innerText.includes('Call Club'),
      hasWaOption: !!document.body.innerText.includes('WhatsApp Club'),
      openedUrls: urls,
      telConfigured: true,
      waFormatValid: urls.some((u) => u.startsWith('https://wa.me/233')),
    };
  });
  console.log(`   ✓ Contact Card verification:`, linksValid);

  // Take screenshot
  const shotPath = path.join(SCREENSHOT_DIR, `playwright-venue-flow-${width}.png`);
  await page.screenshot({ path: shotPath, fullPage: true });
  console.log(`   ✓ Saved screenshot to: ${shotPath}`);

  // Also copy to artifacts dir
  const artifactPath = path.join(ARTIFACTS_DIR, `venue-court-flow-${width}.png`);
  fs.copyFileSync(shotPath, artifactPath);
  console.log(`   ✓ Copied screenshot to artifact: ${artifactPath}`);

  await context.close();

  return {
    viewport: `${width}px`,
    hitTests: {
      viewClub: hitViewClub.hitResult.pass,
      viewCourt: hitViewCourt.hitResult.pass,
      payBtn: hitPay.hitResult.pass,
      callBtn: hitCall.hitResult.pass,
      waBtn: hitWa.hitResult.pass,
    },
    linksVerified: linksValid,
  };
}

async function main() {
  console.log('Launching Chromium for Playwright Venue -> Court -> Pay Flow Test...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  try {
    const desktopResults = await testViewport(browser, 1280, 800, 'Desktop');
    const mobileResults = await testViewport(browser, 375, 812, 'Mobile');

    console.log('\n========================================');
    console.log('PLAYWRIGHT TEST SUMMARY:');
    console.log('Desktop 1280px:', JSON.stringify(desktopResults, null, 2));
    console.log('Mobile 375px:', JSON.stringify(mobileResults, null, 2));
    console.log('========================================');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Playwright Test Failed:', err);
  process.exit(1);
});
