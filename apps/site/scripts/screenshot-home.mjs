import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');
const SCREENSHOTS_DIR = path.resolve(__dirname, '../../../docs/design-reference/site/screenshots');
const ARTIFACTS_DIR = 'C:/Users/nanak/.gemini/antigravity-ide/brain/88b60f00-252f-4c09-a63a-02c9760a7210';
const PORT = 4329;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/') reqPath = '/index.html';
      const filePath = path.join(DIST_DIR, reqPath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    server.listen(PORT, () => {
      console.log(`Static server running at http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

async function captureScreenshots() {
  const server = await startServer();
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // 1. Desktop 1280px
  console.log('Capturing Desktop 1280px...');
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);

  const desktopPath = path.join(SCREENSHOTS_DIR, 'home-desktop-1280.png');
  const desktopFullPath = path.join(SCREENSHOTS_DIR, 'home-desktop-1280-full.png');
  await page.screenshot({ path: desktopPath });
  await page.screenshot({ path: desktopFullPath, fullPage: true });
  console.log(`Saved: ${desktopPath}`);

  // 2. Mobile 375px
  console.log('Capturing Mobile 375px...');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);

  const mobilePath = path.join(SCREENSHOTS_DIR, 'home-mobile-375.png');
  const mobileFullPath = path.join(SCREENSHOTS_DIR, 'home-mobile-375-full.png');
  await page.screenshot({ path: mobilePath });
  await page.screenshot({ path: mobileFullPath, fullPage: true });
  console.log(`Saved: ${mobilePath}`);

  // Copy to Artifacts directory if it exists
  if (fs.existsSync(ARTIFACTS_DIR)) {
    fs.copyFileSync(desktopPath, path.join(ARTIFACTS_DIR, 'home-desktop-1280.png'));
    fs.copyFileSync(desktopFullPath, path.join(ARTIFACTS_DIR, 'home-desktop-1280-full.png'));
    fs.copyFileSync(mobilePath, path.join(ARTIFACTS_DIR, 'home-mobile-375.png'));
    fs.copyFileSync(mobileFullPath, path.join(ARTIFACTS_DIR, 'home-mobile-375-full.png'));
    console.log(`Copied screenshots to artifact directory: ${ARTIFACTS_DIR}`);
  }

  await browser.close();
  server.close();
  console.log('✅ Screenshot capture complete!');
}

captureScreenshots().catch((err) => {
  console.error('Error taking screenshots:', err);
  process.exit(1);
});
