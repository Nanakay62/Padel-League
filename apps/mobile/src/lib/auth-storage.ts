import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'padel_access_token';
const REFRESH_KEY = 'padel_refresh_token';

// In-memory access token storage for web (never written to localStorage)
let memoryAccessToken: string | null = null;

export async function saveAuthTokens(
  accessToken: string,
  refreshToken?: string | null
): Promise<void> {
  if (Platform.OS === 'web') {
    memoryAccessToken = accessToken;
    return;
  }
  await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
  if (refreshToken) {
    await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
  }
}

export async function getAuthTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> {
  if (Platform.OS === 'web') {
    return {
      accessToken: memoryAccessToken,
      refreshToken: null, // Managed via HttpOnly cookie on web
    };
  }
  const accessToken = await SecureStore.getItemAsync(ACCESS_KEY);
  const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
  return { accessToken, refreshToken };
}

export async function clearAuthTokens(): Promise<void> {
  if (Platform.OS === 'web') {
    memoryAccessToken = null;
    return;
  }
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

export function setMemoryAccessToken(token: string | null): void {
  memoryAccessToken = token;
}

export function getMemoryAccessToken(): string | null {
  return memoryAccessToken;
}
