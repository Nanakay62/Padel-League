import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import http from 'http';

const TEST_PORT = 8099;
const API_URL = `http://127.0.0.1:${TEST_PORT}`;
const API_ROOT = path.resolve(__dirname, '../../api');
const DB_FILE = path.resolve(API_ROOT, 'throwaway_test.db');

function requestHttp(
  method: string,
  urlStr: string,
  options: { headers?: Record<string, string>; body?: string } = {}
): Promise<{
  status: number;
  headers: http.IncomingHttpHeaders;
  json: () => Promise<any>;
}> {
  const url = new URL(urlStr);
  return new Promise((resolve, reject) => {
    const headers = { ...options.headers };
    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            json: async () => {
              try {
                return JSON.parse(rawData);
              } catch {
                return rawData;
              }
            },
          });
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

describe('AuthFlow against Real FastAPI Backend', () => {
  let serverProcess: ChildProcess | null = null;

  beforeAll(async () => {
    // 1. Check if server already listening
    try {
      const ping = await requestHttp('GET', `${API_URL}/health`);
      if (ping.status === 200) {
        return;
      }
    } catch {
      // Not listening yet
    }

    // 2. Clean up any stale db file
    if (fs.existsSync(DB_FILE)) {
      try {
        fs.unlinkSync(DB_FILE);
      } catch {
        // Ignore
      }
    }

    // 3. Launch throwaway test server
    serverProcess = spawn(`uv run python scripts/test_server.py ${TEST_PORT}`, {
      cwd: API_ROOT,
      shell: true,
    });

    // 4. Poll health check
    let ready = false;
    for (let i = 0; i < 40; i++) {
      try {
        const res = await requestHttp('GET', `${API_URL}/health`);
        if (res.status === 200) {
          ready = true;
          break;
        }
      } catch {
        // Wait and retry
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    if (!ready) {
      throw new Error(`Test server at ${API_URL} failed to start in time.`);
    }
  }, 35000);

  afterAll(async () => {
    if (serverProcess && serverProcess.pid) {
      try {
        const { execSync } = require('child_process');
        if (process.platform === 'win32') {
          execSync(`taskkill /pid ${serverProcess.pid} /T /F`);
        } else {
          serverProcess.kill('SIGKILL');
        }
      } catch {
        // Ignore exit errors
      }
    }
    await new Promise((r) => setTimeout(r, 1000));
    if (fs.existsSync(DB_FILE)) {
      try {
        fs.unlinkSync(DB_FILE);
      } catch {
        // Ignore
      }
    }
  });

  it('proves full Phone-OTP login, verification, refresh, and logout against real API', async () => {
    const phone = '0245001122';

    // 1. Request OTP
    const reqRes = await requestHttp('POST', `${API_URL}/auth/otp/request`, {
      body: JSON.stringify({ phone }),
    });
    expect(reqRes.status).toBe(200);
    const reqData = await reqRes.json();
    expect(reqData.phone_e164).toBe('+233245001122');
    expect(reqData.expires_in_seconds).toBe(300);
    expect(reqData.expires_at).toBeDefined();

    // 2. Read test OTP code from test-only memory provider
    const codeRes = await requestHttp('GET', `${API_URL}/auth/test/last-otp`);
    expect(codeRes.status).toBe(200);
    const codeData = await codeRes.json();
    expect(codeData.code).toMatch(/^\d{6}$/);
    const validOtp = codeData.code;

    // 3. Test wrong OTP rejection
    const wrongRes = await requestHttp('POST', `${API_URL}/auth/otp/verify`, {
      body: JSON.stringify({ phone, otp: '000000' }),
    });
    expect(wrongRes.status).toBe(400);
    const wrongData = await wrongRes.json();
    expect(wrongData.detail).toContain('Invalid OTP code');

    // 4. Verify OTP with valid code
    const verifyRes = await requestHttp('POST', `${API_URL}/auth/otp/verify`, {
      body: JSON.stringify({
        phone,
        otp: validOtp,
        name: 'Real Integration Player',
      }),
    });
    expect(verifyRes.status).toBe(200);
    const tokens = await verifyRes.json();
    expect(tokens.access_token).toBeDefined();
    expect(tokens.refresh_token).toBeDefined();
    expect(tokens.is_new_user).toBe(true);

    const setCookie = verifyRes.headers['set-cookie'];
    const cookieHeader = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie || '';
    expect(cookieHeader).toContain('padel_refresh_token');

    // 5. Access /me authenticated
    const meRes = await requestHttp('GET', `${API_URL}/me`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    expect(meRes.status).toBe(200);
    const meData = await meRes.json();
    expect(meData.name).toBe('Real Integration Player');
    expect(meData.phone_e164).toBe('+233245001122');

    // 6. Token refresh
    const refreshRes = await requestHttp('POST', `${API_URL}/auth/refresh`, {
      body: JSON.stringify({ refresh_token: tokens.refresh_token }),
    });
    expect(refreshRes.status).toBe(200);
    const newTokens = await refreshRes.json();
    expect(newTokens.access_token).toBeDefined();
    expect(newTokens.access_token).not.toBe(tokens.access_token);

    // 7. Logout revokes token
    const logoutRes = await requestHttp('POST', `${API_URL}/auth/logout`, {
      body: JSON.stringify({ refresh_token: newTokens.refresh_token }),
    });
    expect(logoutRes.status).toBe(200);

    // 8. Stale/revoked refresh token must fail
    const postLogoutRef = await requestHttp('POST', `${API_URL}/auth/refresh`, {
      body: JSON.stringify({ refresh_token: newTokens.refresh_token }),
    });
    expect(postLogoutRef.status).toBe(401);
  });

  it('enforces 3 requests per hour rate limit on phone number', async () => {
    const rateLimitPhone = '0249995544';

    // 3 requests pass
    for (let i = 0; i < 3; i++) {
      const res = await requestHttp('POST', `${API_URL}/auth/otp/request`, {
        body: JSON.stringify({ phone: rateLimitPhone }),
      });
      expect(res.status).toBe(200);
    }

    // 4th request is rate-limited
    const blockedRes = await requestHttp('POST', `${API_URL}/auth/otp/request`, {
      body: JSON.stringify({ phone: rateLimitPhone }),
    });
    expect(blockedRes.status).toBe(429);
    const blockedData = await blockedRes.json();
    expect(blockedData.detail).toContain('Too many OTP requests');
  });
});
