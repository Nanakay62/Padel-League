import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Application environment configuration.
 *
 * Reads EXPO_PUBLIC_API_URL from environment if defined.
 * Otherwise, intelligently determines the API host:
 * - Web: uses current hostname:8000 (e.g. localhost:8000 or 127.0.0.1:8000)
 * - Expo Go / Dev Client (LAN): extracts host machine IP from Constants.expoConfig?.hostUri
 * - Android Emulator: falls back to 10.0.2.2:8000
 * - Default: localhost:8000
 */
export function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return `http://${window.location.hostname}:8000`;
    }
    return 'http://localhost:8000';
  }

  // Running on mobile via Expo Metro (Expo Go or development build)
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ??
    (Constants as any).manifest?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:8000`;
    }
  }

  // Android emulator loopback alias to host machine
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }

  return 'http://localhost:8000';
}
