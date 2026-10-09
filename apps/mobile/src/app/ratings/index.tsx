import React from 'react';
import {
  RatingHistoryData,
  RatingHistoryScreen,
} from '@/features/ratings/RatingHistoryScreen';
import { Screen, PageHeader } from '@/components/ui';

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
  return (
    <Screen>
      <PageHeader
        title="My Rating"
        subtitle="Performance & Level History"
        showBack
      />
      <RatingHistoryScreen data={SAMPLE_RATING_DATA} />
    </Screen>
  );
}
