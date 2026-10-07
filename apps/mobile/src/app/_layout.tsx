import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="events" options={{ headerShown: false }} />
        <Stack.Screen name="venues" options={{ headerShown: false }} />
        <Stack.Screen name="leagues" options={{ headerShown: false }} />
        <Stack.Screen name="ratings" options={{ headerShown: false }} />
        <Stack.Screen name="partners" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="credits" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
