import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import http from 'http';

const TEST_PORT = 8098;
const API_URL = `http://127.0.0.1:${TEST_PORT}`;
const API_ROOT = path.resolve(__dirname, '../../api');
const DB_FILE = path.resolve(API_ROOT, 'throwaway_email_test.db');

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

describe('EmailAuthFlow against Real FastAPI Backend', () => {
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

    // 3. Launch throwaway test server with distinct DB
    serverProcess = spawn(`uv run python scripts/test_server.py ${TEST_PORT}`, {
      cwd: API_ROOT,
      shell: true,
      env: {
        ...process.env,
        DATABASE_URL: `sqlite+aiosqlite:///${DB_FILE.replace(/\\/g, '/')}`,
      },
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

  it('proves full Email register, verify, login, refresh, logout, and password reset against real API', async () => {
    const runId = Date.now();
    const email = `real.player.${runId}@padelghana.com`;
    const password = 'StrongPassword123!';
    const newPassword = 'NewSecretPassword456!';

    // 1. Register with email
    const regRes = await requestHttp('POST', `${API_URL}/auth/register`, {
      body: JSON.stringify({
        email,
        password,
        name: 'Real Email Player',
      }),
    });
    expect(regRes.status).toBe(200);
    const regData = await regRes.json();
    expect(regData.message).toContain('link has been sent');

    // 2. Fetch verification token from dispatched email
    const emailRes = await requestHttp('GET', `${API_URL}/auth/test/last-email`);
    expect(emailRes.status).toBe(200);
    const emailData = await emailRes.json();
    expect(emailData.to).toBe(email);
    expect(emailData.body_text).toContain('Not you? You can safely ignore this email.');

    const tokenMatch = emailData.body_text.match(/token=([A-Za-z0-9_\-]+)/);
    expect(tokenMatch).not.toBeNull();
    const verifyToken = tokenMatch![1];

    // 3. Verify email with single-use token
    const verifyRes = await requestHttp('POST', `${API_URL}/auth/verify-email`, {
      body: JSON.stringify({ token: verifyToken }),
    });
    expect(verifyRes.status).toBe(200);
    const verifyData = await verifyRes.json();
    expect(verifyData.message).toContain('Email verified successfully');

    // Replay of same single-use token fails (400)
    const replayVerifyRes = await requestHttp('POST', `${API_URL}/auth/verify-email`, {
      body: JSON.stringify({ token: verifyToken }),
    });
    expect(replayVerifyRes.status).toBe(400);

    // 4. Login with verified email and password
    const loginRes = await requestHttp('POST', `${API_URL}/auth/login`, {
      body: JSON.stringify({
        email,
        password,
      }),
    });
    expect(loginRes.status).toBe(200);
    const tokens = await loginRes.json();
    expect(tokens.access_token).toBeDefined();
    expect(tokens.refresh_token).toBeDefined();

    const setCookie = loginRes.headers['set-cookie'];
    const cookieHeader = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie || '';
    expect(cookieHeader).toContain('padel_refresh_token');

    // 5. Access /me authenticated
    const meRes = await requestHttp('GET', `${API_URL}/me`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    expect(meRes.status).toBe(200);
    const meData = await meRes.json();
    expect(meData.name).toBe('Real Email Player');
    expect(meData.email).toBe(email);
    expect(meData.email_verified).toBe(true);

    // 6. Token refresh rotates token
    const refreshRes = await requestHttp('POST', `${API_URL}/auth/refresh`, {
      body: JSON.stringify({ refresh_token: tokens.refresh_token }),
    });
    expect(refreshRes.status).toBe(200);
    const refreshedTokens = await refreshRes.json();
    expect(refreshedTokens.access_token).toBeDefined();
    expect(refreshedTokens.access_token).not.toBe(tokens.access_token);
    expect(refreshedTokens.refresh_token).not.toBe(tokens.refresh_token);

    // 7. Logout revokes token
    const logoutRes = await requestHttp('POST', `${API_URL}/auth/logout`, {
      body: JSON.stringify({ refresh_token: refreshedTokens.refresh_token }),
    });
    expect(logoutRes.status).toBe(200);

    // Revoked token fails to refresh
    const postLogoutRefresh = await requestHttp('POST', `${API_URL}/auth/refresh`, {
      body: JSON.stringify({ refresh_token: refreshedTokens.refresh_token }),
    });
    expect(postLogoutRefresh.status).toBe(401);

    // 8. Password reset request (returns 200 without leaking existence)
    const resetReqRes = await requestHttp('POST', `${API_URL}/auth/password-reset/request`, {
      body: JSON.stringify({ email }),
    });
    expect(resetReqRes.status).toBe(200);
    const resetReqData = await resetReqRes.json();
    expect(resetReqData.message).toContain('If that email is registered');

    // 9. Read reset token from test email
    const resetEmailRes = await requestHttp('GET', `${API_URL}/auth/test/last-email`);
    expect(resetEmailRes.status).toBe(200);
    const resetEmailData = await resetEmailRes.json();
    expect(resetEmailData.to).toBe(email);
    const resetMatch = resetEmailData.body_text.match(/token=([A-Za-z0-9_\-]+)/);
    expect(resetMatch).not.toBeNull();
    const resetToken = resetMatch![1];

    // 10. Confirm password reset with new password
    const confirmRes = await requestHttp('POST', `${API_URL}/auth/password-reset/confirm`, {
      body: JSON.stringify({
        token: resetToken,
        new_password: newPassword,
      }),
    });
    expect(confirmRes.status).toBe(200);
    const confirmData = await confirmRes.json();
    expect(confirmData.message).toContain('Password has been successfully updated');

    // 11. Old password now rejected
    const oldLoginRes = await requestHttp('POST', `${API_URL}/auth/login`, {
      body: JSON.stringify({ email, password }),
    });
    expect(oldLoginRes.status).toBe(401);

    // 12. New password succeeds
    const newLoginRes = await requestHttp('POST', `${API_URL}/auth/login`, {
      body: JSON.stringify({ email, password: newPassword }),
    });
    expect(newLoginRes.status).toBe(200);
    const newSession = await newLoginRes.json();
    expect(newSession.access_token).toBeDefined();
  });
});
