import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { AnimatedSplashOverlay } from '@/components/animated-icon';

import { AuthProvider } from '@/context/AuthContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': require('../../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../../assets/fonts/Inter-SemiBold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  return (
    <AuthProvider>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="events/index" />
        <Stack.Screen name="events/create" />
        <Stack.Screen name="events/[id]/index" />
        <Stack.Screen name="events/[id]/live" />
        <Stack.Screen name="venues/index" />
        <Stack.Screen name="venues/[id]/index" />
        <Stack.Screen name="venues/[id]/courts/[courtId]" />
        <Stack.Screen name="leagues/index" />
        <Stack.Screen name="ratings/index" />
        <Stack.Screen name="partners/index" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="credits" />
        <Stack.Screen name="search" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="login" />
        <Stack.Screen name="onboarding" />
      </Stack>
    </AuthProvider>
  );
}
