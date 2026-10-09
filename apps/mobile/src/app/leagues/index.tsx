import React from 'react';
import { useRouter } from 'expo-router';
import {
  LeagueBoxItem,
  LeagueStandingsScreen,
} from '@/features/leagues/LeagueStandingsScreen';
import { Screen, PageHeader } from '@/components/ui';

const SAMPLE_BOXES: LeagueBoxItem[] = [
  {
    id: 'box-1',
    box_number: 1,
    name: 'Premier Box',
    standings: [
      {
        rank: 1,
        pair_id: 'p1',
        pair_name: 'Kwame A. & Yaw O.',
        points: 42,
        matches_played: 16,
        sets_won: 14,
        sets_lost: 2,
        games_won: 84,
        games_lost: 32,
        set_difference: 12,
        game_difference: 52,
        walkovers_given: 0,
        zone: 'SAFE',
        rating: 4.82,
        venue: 'East Legon Padel Club',
        form: ['W', 'W', 'W'],
      },
      {
        rank: 2,
        pair_id: 'p2',
        pair_name: 'Kofi M. & Nii T.',
        points: 36,
        matches_played: 15,
        sets_won: 12,
        sets_lost: 3,
        games_won: 76,
        games_lost: 40,
        set_difference: 9,
        game_difference: 36,
        walkovers_given: 0,
        zone: 'SAFE',
        rating: 4.65,
        venue: 'Cantonments Social Club',
        form: ['W', 'L', 'W'],
      },
      {
        rank: 3,
        pair_id: 'p3',
        pair_name: 'Ekow B. & Farouk S.',
        points: 30,
        matches_played: 15,
        sets_won: 10,
        sets_lost: 5,
        games_won: 68,
        games_lost: 50,
        set_difference: 5,
        game_difference: 18,
        walkovers_given: 0,
        zone: 'SAFE',
        rating: 4.41,
        venue: 'Airport Residential Padel',
        form: ['L', 'W', 'W'],
      },
      {
        rank: 4,
        pair_id: 'p4',
        pair_name: 'Kwame A. & Partner',
        points: 27,
        matches_played: 13,
        sets_won: 9,
        sets_lost: 4,
        games_won: 62,
        games_lost: 48,
        set_difference: 5,
        game_difference: 14,
        walkovers_given: 0,
        zone: 'SAFE',
        rating: 4.35,
        venue: 'Accra Padel Arena',
        form: ['W', 'W', 'L'],
        is_user: true,
      },
      {
        rank: 5,
        pair_id: 'p5',
        pair_name: 'Nana K. & Paa K.',
        points: 24,
        matches_played: 14,
        sets_won: 8,
        sets_lost: 6,
        games_won: 54,
        games_lost: 56,
        set_difference: 2,
        game_difference: -2,
        walkovers_given: 0,
        zone: 'RELEGATION',
        rating: 4.18,
        venue: 'East Legon Padel Club',
        form: ['L', 'L', 'W'],
      },
    ],
  },
  {
    id: 'box-2',
    box_number: 2,
    name: 'Division 1',
    standings: [
      {
        rank: 1,
        pair_id: 'p6',
        pair_name: 'Airport Netters (Nii & Mike)',
        points: 28,
        matches_played: 10,
        sets_won: 9,
        sets_lost: 1,
        games_won: 58,
        games_lost: 22,
        set_difference: 8,
        game_difference: 36,
        walkovers_given: 0,
        zone: 'PROMOTION',
        rating: 3.95,
        venue: 'Airport Residential Club',
        form: ['W', 'W', 'W'],
      },
      {
        rank: 2,
        pair_id: 'p7',
        pair_name: 'Tema Drivers (Seth & Joe)',
        points: 22,
        matches_played: 10,
        sets_won: 7,
        sets_lost: 3,
        games_won: 48,
        games_lost: 38,
        set_difference: 4,
        game_difference: 10,
        walkovers_given: 0,
        zone: 'SAFE',
        rating: 3.75,
        venue: 'Tema Country Club',
        form: ['W', 'W', 'L'],
      },
      {
        rank: 3,
        pair_id: 'p8',
        pair_name: 'Coast Smashers (Fiifi & Ama)',
        points: 18,
        matches_played: 10,
        sets_won: 5,
        sets_lost: 5,
        games_won: 42,
        games_lost: 46,
        set_difference: 0,
        game_difference: -4,
        walkovers_given: 0,
        zone: 'SAFE',
        rating: 3.60,
        venue: 'Labadi Beach Resort',
        form: ['L', 'W', 'L'],
      },
      {
        rank: 4,
        pair_id: 'p9',
        pair_name: 'Osu Volleyers (Kofi & Sam)',
        points: 12,
        matches_played: 10,
        sets_won: 3,
        sets_lost: 7,
        games_won: 32,
        games_lost: 54,
        set_difference: -4,
        game_difference: -22,
        walkovers_given: 0,
        zone: 'RELEGATION',
        rating: 3.40,
        venue: 'Osu Padel Court',
        form: ['L', 'L', 'L'],
      },
    ],
  },
];

export default function LeaguesIndexScreen() {
  const router = useRouter();

  return (
    <Screen>
      <PageHeader
        title="Accra Padel Leagues & Ladders"
        subtitle="Season 2 • Accra Metro Premier & Division 1"
        showBack
      />

      <LeagueStandingsScreen
        leagueTitle="Accra Padel Leagues & Ladders"
        seasonName="Season 2 • Accra Metro Premier"
        cycleWeeks={10}
        boxes={SAMPLE_BOXES}
        onCreateChallenge={() => router.push('/events')}
      />
    </Screen>
  );
}
