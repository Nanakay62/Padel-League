import { apiFetch, refreshSession } from '../src/lib/api-client';
import * as authStorage from '../src/lib/auth-storage';

describe('apiClient single-flight refresh', () => {
  const originalFetch = global.fetch;

  beforeEach(async () => {
    await authStorage.clearAuthTokens();
    await authStorage.saveAuthTokens('expired-token');
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('shares ONE refresh promise across 3 concurrent 401 requests', async () => {
    let refreshCallCount = 0;
    let eventsCallCount = 0;

    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = input.toString();

      if (urlStr.endsWith('/auth/refresh')) {
        refreshCallCount++;
        // Small delay to simulate real network request
        await new Promise((r) => setTimeout(r, 20));
        return {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: 'refreshed-token-999',
            refresh_token: 'new-refresh-token',
          }),
        } as unknown as Response;
      }

      if (urlStr.endsWith('/events')) {
        eventsCallCount++;
        const authHeader = (init?.headers as Headers)?.get?.('Authorization') ||
          (init?.headers as Record<string, string>)?.[('Authorization')] ||
          (init?.headers as Record<string, string>)?.[('authorization')];

        // Fail first with expired token, succeed with refreshed token
        if (authHeader === 'Bearer refreshed-token-999') {
          return {
            ok: true,
            status: 200,
            json: async () => ({ items: [] }),
          } as unknown as Response;
        }

        return {
          ok: false,
          status: 401,
          json: async () => ({ detail: 'Token expired' }),
        } as unknown as Response;
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({}),
      } as unknown as Response;
    }) as unknown as typeof fetch;

    // Launch 3 parallel requests with expired token
    const [res1, res2, res3] = await Promise.all([
      apiFetch('/events'),
      apiFetch('/events'),
      apiFetch('/events'),
    ]);

    // All 3 requests must succeed after refresh
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res3.status).toBe(200);

    // Refresh must be called EXACTLY ONCE
    expect(refreshCallCount).toBe(1);

    // Initial 3 requests + 3 retried requests = 6 calls to /events
    expect(eventsCallCount).toBe(6);
  });
});
