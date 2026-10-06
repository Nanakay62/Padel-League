import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PadelBrand } from '@/constants/theme';
import {
  LeagueBoxItem,
  LeagueStandingsScreen,
} from '@/features/leagues/LeagueStandingsScreen';

const SAMPLE_BOXES: LeagueBoxItem[] = [
  {
    id: 'box-1',
    box_number: 1,
    name: 'Premier Box',
    standings: [
      {
        rank: 1,
        pair_id: 'p1',
        pair_name: 'Accra Aces (Yaw & Kojo)',
        points: 9,
        matches_played: 3,
        sets_won: 6,
        sets_lost: 1,
        games_won: 38,
        games_lost: 20,
        set_difference: 5,
        game_difference: 18,
        walkovers_given: 0,
        zone: 'SAFE', // Box 1 champion stays in Box 1
      },
      {
        rank: 2,
        pair_id: 'p2',
        pair_name: 'Spin Masters (Kwame & Esi)',
        points: 6,
        matches_played: 3,
        sets_won: 4,
        sets_lost: 3,
        games_won: 30,
        games_lost: 28,
        set_difference: 1,
        game_difference: 2,
        walkovers_given: 0,
        zone: 'SAFE',
      },
      {
        rank: 3,
        pair_id: 'p3',
        pair_name: 'Coast Smashers (Fiifi & Ama)',
        points: 4,
        matches_played: 3,
        sets_won: 3,
        sets_lost: 4,
        games_won: 26,
        games_lost: 32,
        set_difference: -1,
        game_difference: -6,
        walkovers_given: 0,
        zone: 'SAFE',
      },
      {
        rank: 4,
        pair_id: 'p4',
        pair_name: 'Osu Volleyers (Kofi & Sam)',
        points: 1,
        matches_played: 3,
        sets_won: 1,
        sets_lost: 6,
        games_won: 18,
        games_lost: 36,
        set_difference: -5,
        game_difference: -18,
        walkovers_given: 0,
        zone: 'RELEGATION',
      },
    ],
  },
  {
    id: 'box-2',
    box_number: 2,
    name: 'Challenger Box',
    standings: [
      {
        rank: 1,
        pair_id: 'p5',
        pair_name: 'Airport Netters (Nii & Mike)',
        points: 9,
        matches_played: 3,
        sets_won: 6,
        sets_lost: 0,
        games_won: 36,
        games_lost: 12,
        set_difference: 6,
        game_difference: 24,
        walkovers_given: 0,
        zone: 'PROMOTION',
      },
      {
        rank: 2,
        pair_id: 'p6',
        pair_name: 'Tema Drivers (Seth & Joe)',
        points: 5,
        matches_played: 3,
        sets_won: 3,
        sets_lost: 3,
        games_won: 28,
        games_lost: 28,
        set_difference: 0,
        game_difference: 0,
        walkovers_given: 0,
        zone: 'SAFE',
      },
    ],
  },
];

export default function LeaguesIndexScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← Home</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Greater Accra Box Leagues</Text>
        </View>

        <LeagueStandingsScreen
          leagueTitle="Greater Accra Box League 2026"
          seasonName="Cycle 3 • October"
          cycleWeeks={4}
          boxes={SAMPLE_BOXES}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PadelBrand.charcoal,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 4,
  },
  backBtn: {
    marginBottom: 8,
  },
  backBtnText: {
    fontSize: 13,
    color: PadelBrand.electricGreen,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
