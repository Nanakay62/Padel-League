import React from 'react';
import { useRouter } from 'expo-router';
import { LevelOnboarding } from '@/features/profile/LevelOnboarding';
import { Screen, PageHeader } from '@/components/ui';

export default function OnboardingScreen() {
  const router = useRouter();

  const handleComplete = (_level: number, _band: string) => {
    router.replace('/');
  };

  return (
    <Screen>
      <PageHeader
        title="Find Your Padel Level"
        subtitle="Self-assessment calibration"
        showBack
      />
      <LevelOnboarding onComplete={handleComplete} />
    </Screen>
  );
}
