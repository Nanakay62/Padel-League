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

  // 2. Leagues Tab Screen - Banner and Standings Table
  await page.goto(BASE_URL + '/leagues', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '07_mobile_leagues_banner_and_standings.png') });
  console.log('Captured 07_mobile_leagues_banner_and_standings.png');

  // 3. Open Challenge Modal from "+ Create Ladder Challenge" button
  const createChallengeBtn = page.getByTestId('leagues-create-challenge-btn');
  if (await createChallengeBtn.count() > 0) {
    await createChallengeBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '08_mobile_leagues_challenge_modal.png') });
    console.log('Captured 08_mobile_leagues_challenge_modal.png');

    // Close challenge modal
    const closeChallengeBtn = page.getByTestId('challenge-modal-close-btn');
    if (await closeChallengeBtn.count() > 0) {
      await closeChallengeBtn.click();
      await page.waitForTimeout(600);
    }
  }

  // 4. Scroll to Scheduled Challenge Duel Card and open Enter Scores Modal
  await page.evaluate(() => {
    const scroller = document.querySelector('.shell-right-col') || window;
    scroller.scrollTo({ top: 450, behavior: 'instant' });
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '09_mobile_leagues_scheduled_duel_card.png') });
  console.log('Captured 09_mobile_leagues_scheduled_duel_card.png');

  const enterScoresBtn = page.getByTestId('challenge-enter-scores-btn');
  if (await enterScoresBtn.count() > 0) {
    await enterScoresBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '10_mobile_leagues_enter_scores_modal.png') });
    console.log('Captured 10_mobile_leagues_enter_scores_modal.png');
  }

  await mobileContext.close();
  await browser.close();
  console.log('All detailed screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
