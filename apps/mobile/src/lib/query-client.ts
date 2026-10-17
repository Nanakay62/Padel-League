import { AppState, AppStateStatus, Platform } from 'react-native';
import { focusManager, QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60 * 1000, // 60 seconds freshness for pilot launch
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

export function setupQueryClientListeners(): () => void {
  const onAppStateChange = (status: AppStateStatus) => {
    if (Platform.OS !== 'web') {
      focusManager.setFocused(status === 'active');
    }
  };

  const subscription = AppState.addEventListener('change', onAppStateChange);
  return () => {
    subscription.remove();
  };
}
