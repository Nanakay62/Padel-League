import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import http from 'http';

const TEST_PORT = 8098;
const API_URL = `http://127.0.0.1:${TEST_PORT}`;
const API_ROOT = path.resolve(__dirname, '../../api');
const DB_FILE = path.resolve(API_ROOT, 'throwaway_test_onboarding.db');

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

describe('LevelOnboarding and Partner Discovery against Real FastAPI Backend', () => {
  let serverProcess: ChildProcess | null = null;

  beforeAll(async () => {
    // 1. Clean up any stale db file
    if (fs.existsSync(DB_FILE)) {
      try {
        fs.unlinkSync(DB_FILE);
      } catch {
        // Ignore
      }
    }

    // 2. Launch throwaway test server with distinct db
    serverProcess = spawn(`uv run python scripts/test_server.py ${TEST_PORT}`, {
      cwd: API_ROOT,
      shell: true,
      env: {
        ...process.env,
        DATABASE_URL: `sqlite+aiosqlite:///${DB_FILE}`,
        ENVIRONMENT: 'test',
      },
    });

    // 3. Poll health check
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

  it('rejects unauthenticated level onboarding with 401', async () => {
    const res = await requestHttp('POST', `${API_URL}/me/onboarding`, {
      body: JSON.stringify({
        years_playing: '1_to_3',
        match_experience: 'regular',
        uses_bandeja_vibora: true,
        wall_confidence: 'comfortable',
      }),
    });
    expect(res.status).toBe(401);
  });

  it('submits level onboarding questions, returns provisional band, and updates /me profile', async () => {
    const phone = '0249998811';
    const fullName = 'Kofi Mensah';

    // 1. Request OTP
    const reqRes = await requestHttp('POST', `${API_URL}/auth/otp/request`, {
      body: JSON.stringify({ phone }),
    });
    expect(reqRes.status).toBe(200);

    // 2. Fetch test OTP code
    const otpRes = await requestHttp('GET', `${API_URL}/auth/test/last-otp`);
    const otpBody = await otpRes.json();
    const otpCode = otpBody.code;
    expect(otpCode).toMatch(/^\d{6}$/);

    // 3. Verify OTP and authenticate
    const verifyRes = await requestHttp('POST', `${API_URL}/auth/otp/verify`, {
      body: JSON.stringify({
        phone,
        otp: otpCode,
        name: fullName,
      }),
    });
    expect(verifyRes.status).toBe(200);
    const verifyBody = await verifyRes.json();
    const token = verifyBody.access_token;
    expect(token).toBeDefined();

    // 4. Initial profile should be provisional
    const initialProfileRes = await requestHttp('GET', `${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(initialProfileRes.status).toBe(200);
    const initialProfile = await initialProfileRes.json();
    expect(initialProfile.name).toBe(fullName);

    // 5. Submit onboarding questionnaire
    const onboardRes = await requestHttp('POST', `${API_URL}/me/onboarding`, {
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        years_playing: '1_to_3',
        match_experience: 'regular',
        uses_bandeja_vibora: true,
        wall_confidence: 'comfortable',
      }),
    });
    expect(onboardRes.status).toBe(200);
    const onboardBody = await onboardRes.json();

    // Invariants:
    // score = 1.5 + 0.5 (1_to_3) + 0.5 (regular) + 0.5 (bandeja) + 0.3 (comfortable) = 3.3
    expect(onboardBody.level).toBeCloseTo(3.3, 1);
    expect(onboardBody.level_band).toContain('Intermediate');
    expect(onboardBody.is_provisional).toBe(true);
    expect(onboardBody.explanation).toBeDefined();

    // 6. Verify /me reflects updated level and provisional status
    const updatedProfileRes = await requestHttp('GET', `${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(updatedProfileRes.status).toBe(200);
    const updatedProfile = await updatedProfileRes.json();
    expect(updatedProfile.is_provisional).toBe(true);

    // 7. Discover partner via /partners and assert privacy: First Name + Last Initial ONLY
    const partnersRes = await requestHttp(
      'GET',
      `${API_URL}/partners?min_level=2.0&max_level=4.5`
    );
    expect(partnersRes.status).toBe(200);
    const partners = await partnersRes.json();
    expect(Array.isArray(partners)).toBe(true);

    // Find Kofi Mensah in partners
    const kofiPartner = partners.find((p: any) => p.display_name === 'Kofi M.');
    expect(kofiPartner).toBeDefined();
    expect(kofiPartner.display_name).toBe('Kofi M.');
    // Privacy: full name and phone number must NEVER be leaked in partner discovery
    expect(kofiPartner.phone).toBeUndefined();
    expect(kofiPartner.phone_e164).toBeUndefined();
    expect(kofiPartner.name).toBeUndefined();
  });
});
