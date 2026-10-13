import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import http from 'http';

const TEST_PORT = 8096;
const API_URL = `http://127.0.0.1:${TEST_PORT}`;
const API_ROOT = path.resolve(__dirname, '../../api');
const DB_FILE = path.resolve(API_ROOT, 'throwaway_test_profile.db');

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

describe('Profile Deletion & Session Invalidation against Real FastAPI Backend', () => {
  let serverProcess: ChildProcess | null = null;

  beforeAll(async () => {
    try {
      const ping = await requestHttp('GET', `${API_URL}/health`);
      if (ping.status === 200) {
        return;
      }
    } catch {
      // Server not up yet
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        fs.unlinkSync(DB_FILE);
      } catch {
        // Ignore
      }
    }

    serverProcess = spawn(`uv run python scripts/test_server.py ${TEST_PORT}`, {
      cwd: API_ROOT,
      shell: true,
    });

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
        // Ignore
      }
    }
  });

  it('performs OTP login, verifies /me profile, deletes account via DELETE /me, and verifies session revocation', async () => {
    const testPhone = '0249876543';

    // 1. Request OTP
    const reqOtp = await requestHttp('POST', `${API_URL}/auth/otp/request`, {
      body: JSON.stringify({ phone: testPhone }),
    });
    expect(reqOtp.status).toBe(200);

    // 2. Fetch test OTP code from test memory provider
    const codeRes = await requestHttp('GET', `${API_URL}/auth/test/last-otp`);
    expect(codeRes.status).toBe(200);
    const codeData = await codeRes.json();
    const validOtp = codeData.code;

    // 3. Verify OTP
    const verifyOtp = await requestHttp('POST', `${API_URL}/auth/otp/verify`, {
      body: JSON.stringify({
        phone: testPhone,
        otp: validOtp,
        name: 'Kofi Deletion Test',
      }),
    });
    expect(verifyOtp.status).toBe(200);
    const tokenData = await verifyOtp.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    expect(accessToken).toBeTruthy();

    // 4. Verify /me returns the user profile
    const meRes = await requestHttp('GET', `${API_URL}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(meRes.status).toBe(200);
    const profile = await meRes.json();
    expect(profile.name).toBe('Kofi Deletion Test');
    expect(profile.phone_e164).toBe('+233249876543');

    // 5. Request account deletion (Act 843 compliance)
    const delRes = await requestHttp('DELETE', `${API_URL}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(delRes.status).toBe(204);

    // 6. Verify /me now reflects anonymized "Former player" record
    const meAfterDel = await requestHttp('GET', `${API_URL}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(meAfterDel.status).toBe(200);
    const postDelData = await meAfterDel.json();
    expect(postDelData.name).toBe('Former player');
    expect(postDelData.is_guest).toBe(false);

    // 7. Verify refresh token was revoked on server
    const refreshRes = await requestHttp('POST', `${API_URL}/auth/refresh`, {
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    expect(refreshRes.status).toBe(401);
  });
});
