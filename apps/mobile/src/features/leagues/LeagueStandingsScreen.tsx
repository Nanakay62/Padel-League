import React, { useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Tokens, Typography } from '@/constants/theme';
import { Card, Chip, StatusPill, Button } from '@/components/ui';

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
      <Card style={styles.headerCard}>
        <Text style={styles.leagueTitle}>{leagueTitle}</Text>
        <Text style={styles.seasonSubtitle}>
          {seasonName} • {cycleWeeks}-Week Box Cycle
        </Text>
      </Card>

      {/* Box Tabs */}
      {boxes.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {boxes.map((b, idx) => (
            <Chip
              key={b.id}
              label={`Box ${b.box_number}: ${b.name}`}
              selected={selectedBoxIndex === idx}
              onPress={() => setSelectedBoxIndex(idx)}
            />
          ))}
        </ScrollView>
      )}

      {/* Standings Table Card */}
      {currentBox ? (
        <Card style={styles.boxCard}>
          <View style={styles.boxHeaderRow}>
            <Text style={styles.boxTitle}>
              Box {currentBox.box_number} Standings
            </Text>
            {onViewFixtures && (
              <Button
                title="View Fixtures"
                variant="ghost"
                size="sm"
                onPress={() => onViewFixtures(currentBox.id)}
              />
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
                <Text style={[styles.cellText, styles.rankCol, styles.boldText, Typography.tabularNums]}>
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
                <Text style={[styles.cellText, styles.numCol, Typography.tabularNums]}>
                  {item.matches_played}
                </Text>
                <Text style={[styles.cellText, styles.numCol, Typography.tabularNums]}>
                  {item.sets_won}-{item.sets_lost}
                </Text>
                <Text
                  style={[
                    styles.cellText,
                    styles.numCol,
                    Typography.tabularNums,
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
                <Text style={[styles.cellText, styles.ptsCol, styles.boldPts, Typography.tabularNums]}>
                  {item.points}
                </Text>
                <View style={styles.zoneCol}>
                  {item.zone === 'PROMOTION' && (
                    <StatusPill label="Up" variant="success" />
                  )}
                  {item.zone === 'RELEGATION' && (
                    <StatusPill label="Down" variant="danger" />
                  )}
                  {item.zone === 'SAFE' && (
                    <Text style={styles.safeText}>-</Text>
                  )}
                </View>
              </View>
            )}
          />
        </Card>
      ) : null}

      {/* League Scoring Rules Footnote */}
      <Card style={styles.rulesNoteCard}>
        <Text style={styles.rulesNoteTitle}>Scoring & Tie-break System</Text>
        <Text style={styles.rulesNoteBody}>
          Win: 3 pts | Played Loss: 1 pt | Walkover Loss: 0 pts{'\n'}
          Tiebreak: Points, Head-to-Head, Set Diff, Game Diff{'\n'}
          Top pairs promoted up; bottom pairs relegated at cycle end.
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Tokens.spacing.base,
  },
  headerCard: {
    gap: Tokens.spacing.xs,
  },
  leagueTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.lg,
    lineHeight: Tokens.lineHeight.lg,
    color: Tokens.colors.text,
  },
  seasonSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textMuted,
  },
  tabsContainer: {
    flexGrow: 0,
  },
  tabsContent: {
    flexDirection: 'row',
    gap: Tokens.spacing.sm,
  },
  boxCard: {
    padding: Tokens.spacing.base,
    gap: Tokens.spacing.md,
  },
  boxHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boxTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    color: Tokens.colors.text,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Tokens.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.colors.border,
  },
  headerCell: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.colors.border,
    minHeight: Tokens.touch.minTarget,
  },
  cellText: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
    textAlign: 'center',
  },
  boldText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  boldPts: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.greenText,
  },
  pairNameText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
  },
  walkoverSubtext: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.danger,
    marginTop: 2,
  },
  rankCol: {
    width: 24,
  },
  pairCol: {
    flex: 1,
    paddingHorizontal: Tokens.spacing.xs,
  },
  numCol: {
    width: 38,
  },
  ptsCol: {
    width: 34,
  },
  zoneCol: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positiveDiff: {
    color: Tokens.colors.greenText,
  },
  negativeDiff: {
    color: Tokens.colors.danger,
  },
  safeText: {
    color: Tokens.colors.textMuted,
    textAlign: 'center',
  },
  rulesNoteCard: {
    gap: Tokens.spacing.xs,
  },
  rulesNoteTitle: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rulesNoteBody: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textMuted,
  },
});
