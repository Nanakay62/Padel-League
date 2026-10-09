import { Platform } from 'react-native';
import { clearAuthTokens, getAuthTokens, saveAuthTokens } from './auth-storage';
import { getApiBaseUrl } from './config';

type AuthListener = (isAuthenticated: boolean) => void;
const authListeners = new Set<AuthListener>();

export function subscribeAuth(listener: AuthListener): () => void {
  authListeners.add(listener);
  return () => {
    authListeners.delete(listener);
  };
}

function notifyAuthChange(isAuthenticated: boolean) {
  authListeners.forEach((listener) => {
    try {
      listener(isAuthenticated);
    } catch {
      // Ignore listener error
    }
  });
}

// Single-flight mutex promise for in-flight refresh token requests
let refreshPromise: Promise<string> | null = null;

export async function refreshSession(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const baseUrl = getApiBaseUrl();
    const tokens = await getAuthTokens();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    let body: string | undefined = undefined;
    if (Platform.OS !== 'web' && tokens.refreshToken) {
      body = JSON.stringify({ refresh_token: tokens.refreshToken });
    }

    try {
      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers,
        body,
        // On web, cookies (padel_refresh_token) are included automatically
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Token refresh failed with status ${res.status}`);
      }

      const data = await res.json();
      const newAccessToken: string = data.access_token;
      const newRefreshToken: string | undefined = data.refresh_token;

      await saveAuthTokens(newAccessToken, newRefreshToken);
      notifyAuthChange(true);
      return newAccessToken;
    } catch (err) {
      await clearAuthTokens();
      notifyAuthChange(false);
      throw err;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function logout(): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const tokens = await getAuthTokens();

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (tokens.accessToken) {
      headers['Authorization'] = `Bearer ${tokens.accessToken}`;
    }

    let body: string | undefined = undefined;
    if (Platform.OS !== 'web' && tokens.refreshToken) {
      body = JSON.stringify({ refresh_token: tokens.refreshToken });
    }

    await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers,
      body,
      credentials: 'include',
    });
  } catch {
    // Revocation failed, still proceed to wipe local credentials
  } finally {
    await clearAuthTokens();
    notifyAuthChange(false);
  }
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  const url = path.startsWith('http') ? path : `${baseUrl}${path}`;

  const currentTokens = await getAuthTokens();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  if (currentTokens.accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${currentTokens.accessToken}`);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  let response = await fetch(url, fetchOptions);

  // If 401 Unauthorized, perform single-flight refresh and retry once
  if (response.status === 401 && !path.includes('/auth/refresh') && !path.includes('/auth/logout')) {
    try {
      const newAccessToken = await refreshSession();
      const retryHeaders = new Headers(options.headers || {});
      if (!retryHeaders.has('Content-Type') && options.body && typeof options.body === 'string') {
        retryHeaders.set('Content-Type', 'application/json');
      }
      retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);

      response = await fetch(url, {
        ...fetchOptions,
        headers: retryHeaders,
      });
    } catch {
      // Refresh failed, return original 401
      return response;
    }
  }

  return response;
}
