import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MOBILE_DIST = path.resolve(__dirname, '../../mobile/dist');

const PORT = 8085;

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

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:8085'}`);
  let reqPath = decodeURIComponent(parsedUrl.pathname);

  // If mobile dist exists, serve from mobile dist
  if (fs.existsSync(MOBILE_DIST)) {
    let filePath = path.join(MOBILE_DIST, reqPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (!fs.existsSync(filePath) && fs.existsSync(`${filePath}.html`)) {
      filePath = `${filePath}.html`;
    }

    if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }

  // Fallback fallback route handler for app simulation
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  const mode = parsedUrl.searchParams.get('mode');
  res.end(`
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="utf-8"><title>Padel Ghana App</title><style>body{font-family:sans-serif;background:#0F172A;color:#fff;padding:2rem;text-align:center;}</style></head>
    <body>
      <h1>Padel Ghana Client App</h1>
      <p>Route: <strong>${parsedUrl.pathname}</strong> ${mode ? `(mode: ${mode})` : ''}</p>
      <div style="margin-top:2rem;padding:1rem;background:#1E293B;border-radius:8px;display:inline-block;">
        Local App running on port ${PORT}
      </div>
    </body>
    </html>
  `);
});

// Bind to 0.0.0.0 so both IPv4 and IPv6 resolution work
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Local Padel Ghana App server running at http://localhost:${PORT}/ and http://[::1]:${PORT}/`);
});
