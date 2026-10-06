import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PadelBrand } from '@/constants/theme';

export interface BoxStandingItem {
  rank: number;
  pair_id: string;
  pair_name: string;
  points: number;
  matches_played: number;
  sets_won: number;
  sets_lost: number;
  games_won: number;
  games_lost: number;
  set_difference: number;
  game_difference: number;
  walkovers_given: number;
  zone: 'PROMOTION' | 'RELEGATION' | 'SAFE';
}

export interface LeagueBoxItem {
  id: string;
  box_number: number;
  name: string;
  cycle_deadline?: string | null;
  standings: BoxStandingItem[];
}

export interface LeagueStandingsScreenProps {
  leagueTitle: string;
  seasonName: string;
  cycleWeeks: number;
  boxes: LeagueBoxItem[];
  onSelectBox?: (boxId: string) => void;
  onViewFixtures?: (boxId: string) => void;
}

export function LeagueStandingsScreen({
  leagueTitle,
  seasonName,
  cycleWeeks,
  boxes,
  onViewFixtures,
}: LeagueStandingsScreenProps) {
  const [selectedBoxIndex, setSelectedBoxIndex] = useState(0);

  const currentBox = boxes[selectedBoxIndex] || boxes[0];

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.headerCard}>
        <Text style={styles.leagueTitle}>{leagueTitle}</Text>
        <Text style={styles.seasonSubtitle}>
          {seasonName} • {cycleWeeks}-Week Box Cycle
        </Text>
      </View>

      {/* Box Tabs */}
      {boxes.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {boxes.map((b, idx) => (
            <Pressable
              key={b.id}
              style={[
                styles.tabButton,
                selectedBoxIndex === idx && styles.tabButtonActive,
              ]}
              onPress={() => setSelectedBoxIndex(idx)}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  selectedBoxIndex === idx && styles.tabButtonTextActive,
                ]}
              >
                Box {b.box_number}: {b.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Standings Table Card */}
      {currentBox ? (
        <View style={styles.boxCard}>
          <View style={styles.boxHeaderRow}>
            <Text style={styles.boxTitle}>
              Box {currentBox.box_number} Standings
            </Text>
            {onViewFixtures && (
              <Pressable
                style={styles.viewFixturesButton}
                onPress={() => onViewFixtures(currentBox.id)}
              >
                <Text style={styles.viewFixturesButtonText}>View Fixtures →</Text>
              </Pressable>
            )}
          </View>

          {/* Table Headers */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.headerCell, styles.rankCol]}>#</Text>
            <Text style={[styles.headerCell, styles.pairCol]}>Pair</Text>
            <Text style={[styles.headerCell, styles.numCol]}>P</Text>
            <Text style={[styles.headerCell, styles.numCol]}>Sets</Text>
            <Text style={[styles.headerCell, styles.numCol]}>Diff</Text>
            <Text style={[styles.headerCell, styles.ptsCol]}>Pts</Text>
            <Text style={[styles.headerCell, styles.zoneCol]}>Zone</Text>
          </View>

          {/* Standings Rows */}
          <FlatList
            data={currentBox.standings}
            keyExtractor={(item) => item.pair_id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.tableRow}>
                <Text style={[styles.cellText, styles.rankCol, styles.boldText]}>
                  {item.rank}
                </Text>
                <View style={styles.pairCol}>
                  <Text style={styles.pairNameText} numberOfLines={1}>
                    {item.pair_name}
                  </Text>
                  {item.walkovers_given > 0 && (
                    <Text style={styles.walkoverSubtext}>
                      {item.walkovers_given} w/o given
                    </Text>
                  )}
                </View>
                <Text style={[styles.cellText, styles.numCol]}>
                  {item.matches_played}
                </Text>
                <Text style={[styles.cellText, styles.numCol]}>
                  {item.sets_won}-{item.sets_lost}
                </Text>
                <Text
                  style={[
                    styles.cellText,
                    styles.numCol,
                    item.game_difference > 0
                      ? styles.positiveDiff
                      : item.game_difference < 0
                        ? styles.negativeDiff
                        : null,
                  ]}
                >
                  {item.game_difference > 0
                    ? `+${item.game_difference}`
                    : `${item.game_difference}`}
                </Text>
                <Text style={[styles.cellText, styles.ptsCol, styles.boldPts]}>
                  {item.points}
                </Text>
                <View style={styles.zoneCol}>
                  {item.zone === 'PROMOTION' && (
                    <View style={[styles.badge, styles.promoBadge]}>
                      <Text style={styles.promoText}>▲ Up</Text>
                    </View>
                  )}
                  {item.zone === 'RELEGATION' && (
                    <View style={[styles.badge, styles.relegBadge]}>
                      <Text style={styles.relegText}>▼ Down</Text>
                    </View>
                  )}
                  {item.zone === 'SAFE' && (
                    <Text style={styles.safeText}>—</Text>
                  )}
                </View>
              </View>
            )}
          />
        </View>
      ) : null}

      {/* League Scoring Rules Footnote */}
      <View style={styles.rulesNoteCard}>
        <Text style={styles.rulesNoteTitle}>Scoring & Tie-break System</Text>
        <Text style={styles.rulesNoteBody}>
          • Win: 3 pts | Played Loss: 1 pt | Walkover Loss: 0 pts{'\n'}
          • Tiebreak: Points → Head-to-Head → Set Diff → Game Diff{'\n'}
          • Top pairs promoted up; bottom pairs relegated at cycle end.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PadelBrand.charcoal,
    padding: 16,
  },
  headerCard: {
    backgroundColor: PadelBrand.cardDark,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
  leagueTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  seasonSubtitle: {
    fontSize: 13,
    color: PadelBrand.electricGreen,
    fontWeight: '600',
  },
  tabsContainer: {
    maxHeight: 44,
    marginBottom: 12,
  },
  tabsContent: {
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: PadelBrand.cardDark,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
  tabButtonActive: {
    backgroundColor: PadelBrand.electricGreen,
    borderColor: PadelBrand.electricGreen,
  },
  tabButtonText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#0B0F0E',
    fontWeight: '700',
  },
  boxCard: {
    backgroundColor: PadelBrand.cardDark,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
    marginBottom: 16,
  },
  boxHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  boxTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewFixturesButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#25302C',
    borderRadius: 6,
  },
  viewFixturesButtonText: {
    fontSize: 12,
    color: PadelBrand.electricGreen,
    fontWeight: '600',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: PadelBrand.borderDark,
    paddingBottom: 8,
    marginBottom: 6,
  },
  headerCell: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2320',
  },
  rankCol: {
    width: 24,
    textAlign: 'center',
  },
  pairCol: {
    flex: 1,
    paddingHorizontal: 6,
  },
  numCol: {
    width: 38,
    textAlign: 'center',
  },
  ptsCol: {
    width: 36,
    textAlign: 'center',
  },
  zoneCol: {
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 12,
    color: '#E2E8F0',
  },
  boldText: {
    fontWeight: '700',
  },
  boldPts: {
    fontWeight: '700',
    color: PadelBrand.electricGreen,
  },
  pairNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  walkoverSubtext: {
    fontSize: 10,
    color: '#F43F5E',
  },
  positiveDiff: {
    color: PadelBrand.electricGreen,
  },
  negativeDiff: {
    color: '#F43F5E',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  promoBadge: {
    backgroundColor: 'rgba(0, 200, 83, 0.15)',
  },
  promoText: {
    fontSize: 10,
    fontWeight: '700',
    color: PadelBrand.electricGreen,
  },
  relegBadge: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
  },
  relegText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F43F5E',
  },
  safeText: {
    fontSize: 11,
    color: '#64748B',
  },
  rulesNoteCard: {
    backgroundColor: 'rgba(22, 28, 26, 0.6)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
  rulesNoteTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 4,
  },
  rulesNoteBody: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
});
