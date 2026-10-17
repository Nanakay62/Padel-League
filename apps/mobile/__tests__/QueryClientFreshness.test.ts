import { AppState, AppStateStatus } from 'react-native';
import { focusManager } from '@tanstack/react-query';
import { queryClient, setupQueryClientListeners } from '@/lib/query-client';

describe('QueryClient Freshness and Reconnection Policy (Phase 3 / M4)', () => {
  it('enforces 60-second staleTime for rapid freshness during pilot', () => {
    const defaultQueries = queryClient.getDefaultOptions().queries;
    expect(defaultQueries?.staleTime).toBe(60000);
  });

  it('enforces refetch on window focus and reconnect', () => {
    const defaultQueries = queryClient.getDefaultOptions().queries;
    expect(defaultQueries?.refetchOnWindowFocus).toBe(true);
    expect(defaultQueries?.refetchOnReconnect).toBe(true);
  });

  it('subscribes to AppState changes and updates focusManager', () => {
    const focusSpy = jest.spyOn(focusManager, 'setFocused');
    let capturedListener: ((status: AppStateStatus) => void) | null = null;

    jest.spyOn(AppState, 'addEventListener').mockImplementation((type, listener) => {
      if (type === 'change') {
        capturedListener = listener;
      }
      return { remove: jest.fn() } as any;
    });

    const cleanup = setupQueryClientListeners();
    expect(capturedListener).toBeDefined();

    if (capturedListener) {
      (capturedListener as (status: AppStateStatus) => void)('active');
      expect(focusSpy).toHaveBeenCalledWith(true);

      (capturedListener as (status: AppStateStatus) => void)('background');
      expect(focusSpy).toHaveBeenCalledWith(false);
    }

    cleanup();
    focusSpy.mockRestore();
  });
});
