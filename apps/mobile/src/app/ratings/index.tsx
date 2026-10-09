import React from 'react';
import { useRouter } from 'expo-router';
import {
  RatingHistoryData,
  RatingHistoryScreen,
} from '@/features/ratings/RatingHistoryScreen';
import { Screen, PageHeader, Button } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

const SAMPLE_RATING_DATA: RatingHistoryData = {
  user_id: 'usr-kwadwo',
  current_rating: 3.42,
  level_band: 'Intermediate',
  is_provisional: false,
  history: [
    {
      id: 'rh-1',
      match_id: 'm-101',
      rating_before: 3.34,
      rating_after: 3.42,
      delta: 0.08,
      k_factor: 0.12,
      explanation: 'Won Friday Americano final (16-8 vs team avg 3.50)',
      created_at: '2026-10-02T19:30:00Z',
    },
    {
      id: 'rh-2',
      match_id: 'm-100',
      rating_before: 3.38,
      rating_after: 3.34,
      delta: -0.04,
      k_factor: 0.12,
      explanation: 'Lost box league match 1-2 (tight margin)',
      created_at: '2026-09-28T17:00:00Z',
    },
  ],
};

export default function RatingsIndexScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const data: RatingHistoryData =
    isAuthenticated && user && user.level !== undefined
      ? {
          user_id: user.id,
          current_rating: user.level,
          level_band: user.level_band || 'Intermediate',
          is_provisional: user.is_provisional ?? true,
          history: [],
        }
      : SAMPLE_RATING_DATA;

  return (
    <Screen>
      <PageHeader
        title="My Rating"
        subtitle="Performance & Level History"
        showBack
        rightAction={
          <Button
            title="Calibrate Level"
            variant="secondary"
            size="sm"
            onPress={() => router.push('/onboarding' as any)}
          />
        }
      />
      <RatingHistoryScreen data={data} />
    </Screen>
  );
}
