import React, { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { LiveEventScreen, MatchItem, LeaderboardRow } from '@/features/events/LiveEventScreen';

export default function LiveEventRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  const eventId = params.id ?? 'demo-event';

  // Mock initial state for courtside demo
  const [matches, setMatches] = useState<MatchItem[]>([
    {
      id: 'm1',
      courtNumber: 1,
      teamANames: ['Nana Kwame', 'Kofi Mensah'],
      teamBNames: ['Ama Boateng', 'Daniel Kojo'],
      teamAScore: null,
      teamBScore: null,
      status: 'SCHEDULED',
    },
    {
      id: 'm2',
      courtNumber: 2,
      teamANames: ['Abena Serwaa', 'Yaw Osei'],
      teamBNames: ['Akua Darko', 'Kwaku Duah'],
      teamAScore: null,
      teamBScore: null,
      status: 'SCHEDULED',
    },
  ]);

  const [leaderboard] = useState<LeaderboardRow[]>([
    { rank: 1, name: 'Nana Kwame', points: 0, pointDifference: 0, sitOuts: 0 },
    { rank: 2, name: 'Kofi Mensah', points: 0, pointDifference: 0, sitOuts: 0 },
    { rank: 3, name: 'Ama Boateng', points: 0, pointDifference: 0, sitOuts: 0 },
    { rank: 4, name: 'Daniel Kojo', points: 0, pointDifference: 0, sitOuts: 0 },
    { rank: 5, name: 'Abena Serwaa', points: 0, pointDifference: 0, sitOuts: 0 },
    { rank: 6, name: 'Yaw Osei', points: 0, pointDifference: 0, sitOuts: 0 },
    { rank: 7, name: 'Akua Darko', points: 0, pointDifference: 0, sitOuts: 0 },
    { rank: 8, name: 'Kwaku Duah', points: 0, pointDifference: 0, sitOuts: 0 },
    { rank: 9, name: 'Afia Poku', points: 0, pointDifference: 0, sitOuts: 1 },
    { rank: 10, name: 'Kojo Antwi', points: 0, pointDifference: 0, sitOuts: 1 },
    { rank: 11, name: 'Esi Mansa', points: 0, pointDifference: 0, sitOuts: 1 },
  ]);

  const handleScoreSubmitted = (matchId: string, scoreA: number, scoreB: number) => {
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? {
              ...m,
              teamAScore: scoreA,
              teamBScore: scoreB,
              status: 'SCORE_ENTERED',
            }
          : m
      )
    );
  };

  const handleGenerateNextRound = () => {
    // Next round generation
  };

  return (
    <LiveEventScreen
      title={`Thursday Americano (${eventId})`}
      venueName="Accra Padel Club"
      currentRound={1}
      totalRounds={8}
      pointTarget={24}
      matches={matches}
      sitOuts={['Afia Poku', 'Kojo Antwi', 'Esi Mansa']}
      leaderboard={leaderboard}
      onScoreSubmitted={handleScoreSubmitted}
      onGenerateNextRound={handleGenerateNextRound}
    />
  );
}
