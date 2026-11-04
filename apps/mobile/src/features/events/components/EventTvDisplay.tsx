import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Tv, Trophy } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';

export interface TvCourtMatch {
  courtNumber: number;
  teamA: string;
  teamB: string;
  score: string;
}

export interface TvLeaderboardEntry {
  rank: number;
  name: string;
  points: number;
}

export interface EventTvDisplayProps {
  eventName: string;
  venueName: string;
  currentRound: number;
  totalRounds: number;
  courts: TvCourtMatch[];
  leaderboard: TvLeaderboardEntry[];
}

export function EventTvDisplay({
  eventName,
  venueName,
  currentRound,
  totalRounds,
  courts,
  leaderboard,
}: EventTvDisplayProps) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Banner Header */}
      <View style={styles.tvHeader}>
        <View style={styles.tvHeaderLeft}>
          <View style={styles.liveIndicator}>
            <Tv size={16} color={Tokens.colors.lime} />
            <Text style={styles.liveIndicatorText}>LIVE CLUB MONITOR</Text>
          </View>
          <Text style={styles.eventName}>{eventName}</Text>
          <Text style={styles.venueName}>{venueName}</Text>
        </View>

        <View style={styles.roundBox}>
          <Text style={styles.roundLabel}>ROUND</Text>
          <Text style={styles.roundValue}>
            {currentRound} / {totalRounds}
          </Text>
        </View>
      </View>

      {/* Main Grid: Court Assignments + Leaderboard */}
      <View style={styles.mainGrid}>
        {/* Court Matches Panel */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>CURRENT COURT ROUND</Text>
          <View style={styles.courtsList}>
            {courts.map((court) => (
              <View key={`court-${court.courtNumber}`} style={styles.courtCard}>
                <View style={styles.courtBadge}>
                  <Text style={styles.courtBadgeText}>Court {court.courtNumber}</Text>
                </View>

                <View style={styles.matchTeamsRow}>
                  <Text style={styles.teamText} numberOfLines={1}>
                    {court.teamA}
                  </Text>
                  <Text style={styles.vsText}>vs</Text>
                  <Text style={styles.teamText} numberOfLines={1}>
                    {court.teamB}
                  </Text>
                </View>

                <View style={styles.scoreBox}>
                  <Text style={[styles.scoreText, Typography.tabularNums]}>
                    {court.score}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Live Leaderboard Panel */}
        <View style={styles.panel}>
          <View style={styles.panelHeaderRow}>
            <Trophy size={16} color={Tokens.colors.lime} />
            <Text style={styles.panelTitle}>STANDINGS</Text>
          </View>

          <View style={styles.leaderboardList}>
            {leaderboard.map((player) => {
              const isFirst = player.rank === 1;
              return (
                <View
                  key={`rank-${player.rank}-${player.name}`}
                  style={[styles.leaderboardRow, isFirst && styles.leaderboardRowFirst]}
                >
                  <View style={styles.rankBadge}>
                    <Text
                      style={[
                        styles.rankText,
                        isFirst && styles.rankTextFirst,
                      ]}
                    >
                      {player.rank}
                    </Text>
                  </View>
                  <Text style={styles.playerName} numberOfLines={1}>
                    {player.name}
                  </Text>
                  <Text style={[styles.playerPoints, Typography.tabularNums]}>
                    {player.points} pts
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Tokens.colors.live.background,
  },
  content: {
    padding: Tokens.spacing.lg,
    gap: Tokens.spacing.lg,
  },
  tvHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Tokens.colors.live.card,
    borderRadius: Tokens.radii.cardLg,
    padding: Tokens.spacing.lg,
    borderWidth: 1,
    borderColor: Tokens.colors.live.border,
  },
  tvHeaderLeft: {
    gap: Tokens.spacing.xs,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  liveIndicatorText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.lime,
    letterSpacing: 1.2,
  },
  eventName: {
    fontFamily: Typography.fontFamily.display,
    fontSize: Tokens.fontSize.xl,
    lineHeight: Tokens.lineHeight.xl,
    fontWeight: Tokens.fontWeight.bold,
    color: Tokens.colors.live.text,
  },
  venueName: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.sm,
    color: Tokens.colors.live.textMuted,
  },
  roundBox: {
    alignItems: 'center',
    backgroundColor: Tokens.colors.live.background,
    borderRadius: Tokens.radii.card,
    paddingVertical: Tokens.spacing.sm,
    paddingHorizontal: Tokens.spacing.base,
    borderWidth: 1,
    borderColor: Tokens.colors.live.border,
  },
  roundLabel: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xxs,
    color: Tokens.colors.live.textMuted,
    letterSpacing: 1.0,
  },
  roundValue: {
    fontFamily: Typography.fontFamily.display,
    fontSize: Tokens.fontSize.lg,
    fontWeight: Tokens.fontWeight.bold,
    color: Tokens.colors.lime,
  },
  mainGrid: {
    gap: Tokens.spacing.lg,
  },
  panel: {
    backgroundColor: Tokens.colors.live.card,
    borderRadius: Tokens.radii.cardLg,
    padding: Tokens.spacing.base,
    borderWidth: 1,
    borderColor: Tokens.colors.live.border,
    gap: Tokens.spacing.md,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  panelTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.live.textMuted,
    letterSpacing: 1.0,
  },
  courtsList: {
    gap: Tokens.spacing.sm,
  },
  courtCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Tokens.colors.live.background,
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.base,
    borderWidth: 1,
    borderColor: Tokens.colors.live.border,
  },
  courtBadge: {
    backgroundColor: Tokens.colors.live.card,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: Tokens.radii.xs,
  },
  courtBadgeText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.lime,
  },
  matchTeamsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Tokens.spacing.sm,
    paddingHorizontal: Tokens.spacing.sm,
  },
  teamText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Tokens.fontSize.sm,
    color: Tokens.colors.live.text,
  },
  vsText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.live.textMuted,
  },
  scoreBox: {
    backgroundColor: Tokens.colors.live.card,
    paddingHorizontal: Tokens.spacing.md,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.xs,
  },
  scoreText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: Tokens.fontSize.base,
    fontWeight: Tokens.fontWeight.bold,
    color: Tokens.colors.live.text,
  },
  leaderboardList: {
    gap: Tokens.spacing.xs,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Tokens.colors.live.background,
    borderRadius: Tokens.radii.card,
    paddingVertical: Tokens.spacing.sm,
    paddingHorizontal: Tokens.spacing.base,
  },
  leaderboardRowFirst: {
    borderWidth: 1,
    borderColor: Tokens.colors.lime,
  },
  rankBadge: {
    width: 24,
    alignItems: 'center',
  },
  rankText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Tokens.fontSize.sm,
    color: Tokens.colors.live.textMuted,
  },
  rankTextFirst: {
    color: Tokens.colors.lime,
  },
  playerName: {
    flex: 1,
    fontFamily: Typography.fontFamily.medium,
    fontSize: Tokens.fontSize.sm,
    color: Tokens.colors.live.text,
    paddingHorizontal: Tokens.spacing.sm,
  },
  playerPoints: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Tokens.fontSize.sm,
    color: Tokens.colors.live.text,
  },
});
