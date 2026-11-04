import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Medal } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
import { StatusPill } from '@/components/ui';
import type { BoxStandingItem } from '../hooks/useLeagueStandings';

export interface StandingsRowProps {
  item: BoxStandingItem;
  index: number;
  currentBoxId: string;
  onChallengePair?: (pair: BoxStandingItem) => void;
  onViewFixtures?: (boxId: string) => void;
}

export function StandingsRow({
  item,
  index,
  currentBoxId,
  onChallengePair,
  onViewFixtures,
}: StandingsRowProps) {
  const isChampion = item.rank === 1;
  const isUser = Boolean(item.is_user);
  const formHistory =
    item.form || (index % 2 === 0 ? ['W', 'W', 'W'] : ['W', 'L', 'W']);
  const ratingDisplay = item.rating
    ? item.rating.toFixed(2)
    : (4.9 - index * 0.15).toFixed(2);

  return (
    <View
      style={[
        styles.tableRow,
        isChampion && styles.championRow,
        isUser && styles.userRow,
      ]}
    >
      {/* Rank / Rung Column */}
      <View style={styles.rankCol}>
        <View
          style={[
            styles.rankBadge,
            isChampion && styles.championRankBadge,
            isUser && styles.userRankBadge,
          ]}
        >
          <Text
            style={[
              styles.rankText,
              isChampion && styles.championRankText,
              isUser && styles.userRankText,
              Typography.tabularNums,
            ]}
          >
            {item.rank}
          </Text>
        </View>
      </View>

      {/* Team / Pair Column */}
      <View style={styles.pairCol}>
        <View style={styles.pairTitleRow}>
          <Text
            style={[
              styles.pairNameText,
              (isChampion || isUser) && styles.boldText,
            ]}
            numberOfLines={1}
          >
            {item.pair_name}
          </Text>
          {isChampion && (
            <Medal size={14} color={Tokens.colors.goldText} />
          )}
          {isUser && (
            <View style={styles.youBadge}>
              <Text style={styles.youBadgeText}>YOU</Text>
            </View>
          )}
        </View>
        <Text style={styles.pairClubText} numberOfLines={1}>
          {item.venue || 'Accra Padel Arena'}
        </Text>
        {item.walkovers_given > 0 && (
          <Text style={styles.walkoverSubtext}>
            {item.walkovers_given} w/o given
          </Text>
        )}
      </View>

      {/* Rating Column */}
      <View style={styles.ratingCol}>
        <Text
          style={[
            styles.cellText,
            Typography.tabularNums,
            (isChampion || isUser) && styles.boldText,
          ]}
        >
          {ratingDisplay}
        </Text>
      </View>

      {/* W - L Record Column */}
      <View style={styles.recordCol}>
        <Text style={[styles.cellMutedText, Typography.tabularNums]}>
          {item.matches_played > 0
            ? `${item.sets_won} - ${item.sets_lost}`
            : '0 - 0'}
        </Text>
      </View>

      {/* Form Badges Column */}
      <View style={styles.formCol}>
        <View style={styles.formBadgeGroup}>
          {formHistory.map((res, fIdx) => (
            <View
              key={fIdx}
              style={[
                styles.formChip,
                res === 'W' ? styles.formChipWin : styles.formChipLoss,
              ]}
            >
              <Text
                style={[
                  styles.formChipText,
                  res === 'W' ? styles.formChipTextWin : styles.formChipTextLoss,
                ]}
              >
                {res}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Action / Zone Column */}
      <View style={styles.actionCol}>
        {isChampion ? (
          <View style={styles.championPill}>
            <Text style={styles.championPillText}>Champion</Text>
          </View>
        ) : isUser ? (
          <View style={styles.currentRungPill}>
            <Text style={styles.currentRungPillText}>Current</Text>
          </View>
        ) : item.zone === 'PROMOTION' ? (
          <StatusPill label="Up" variant="success" />
        ) : item.zone === 'RELEGATION' ? (
          <StatusPill label="Down" variant="danger" />
        ) : (
          <TouchableOpacity
            testID={`ladder-challenge-btn-rung-${item.rank}`}
            accessibilityRole="button"
            accessibilityLabel={`Challenge ${item.pair_name}`}
            style={styles.challengeBtn}
            activeOpacity={0.7}
            onPress={() => {
              if (onChallengePair) {
                onChallengePair(item);
              } else if (onViewFixtures) {
                onViewFixtures(currentBoxId);
              }
            }}
          >
            <Text style={styles.challengeBtnText}>Challenge</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Tokens.spacing.sm,
    paddingHorizontal: Tokens.spacing.sm,
    borderRadius: Tokens.radii.sm,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.colors.border,
  },
  championRow: {
    backgroundColor: Tokens.colors.surfaceMuted,
  },
  userRow: {
    backgroundColor: Tokens.colors.surfaceMuted,
    borderLeftWidth: 3,
    borderLeftColor: Tokens.colors.primary,
  },
  rankCol: {
    width: 38,
    alignItems: 'center',
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Tokens.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  championRankBadge: {
    backgroundColor: Tokens.colors.gold,
  },
  userRankBadge: {
    backgroundColor: Tokens.colors.text,
  },
  rankText: {
    ...Typography.labelSm,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  championRankText: {
    color: Tokens.colors.goldText,
  },
  userRankText: {
    color: Tokens.colors.surface,
  },
  pairCol: {
    flex: 2,
    paddingHorizontal: Tokens.spacing.xs,
    gap: 2,
  },
  pairTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    flexWrap: 'wrap',
  },
  pairNameText: {
    ...Typography.labelMd,
    color: Tokens.colors.text,
  },
  pairClubText: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  walkoverSubtext: {
    ...Typography.labelSm,
    color: Tokens.colors.danger,
    fontSize: Tokens.fontSize.xs,
  },
  youBadge: {
    backgroundColor: Tokens.colors.slotFilledBg,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: Tokens.radii.xs,
    borderWidth: 1,
    borderColor: Tokens.colors.primary,
  },
  youBadgeText: {
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.primary,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  ratingCol: {
    width: 60,
    alignItems: 'center',
  },
  cellText: {
    ...Typography.bodySm,
    color: Tokens.colors.text,
  },
  cellMutedText: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  recordCol: {
    width: 55,
    alignItems: 'center',
  },
  formCol: {
    width: 65,
    alignItems: 'center',
  },
  formBadgeGroup: {
    flexDirection: 'row',
    gap: 3,
  },
  formChip: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formChipWin: {
    backgroundColor: Tokens.colors.primaryLight,
  },
  formChipLoss: {
    backgroundColor: Tokens.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  formChipText: {
    fontSize: Tokens.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  formChipTextWin: {
    color: Tokens.colors.greenText,
  },
  formChipTextLoss: {
    color: Tokens.colors.textMuted,
  },
  actionCol: {
    width: 78,
    alignItems: 'flex-end',
  },
  championPill: {
    paddingHorizontal: Tokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: Tokens.radii.xs,
    backgroundColor: Tokens.colors.gold,
  },
  championPillText: {
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.goldText,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  currentRungPill: {
    paddingHorizontal: Tokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: Tokens.radii.xs,
    backgroundColor: Tokens.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  currentRungPillText: {
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.textMuted,
  },
  challengeBtn: {
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: 4,
    borderRadius: Tokens.radii.chip,
    backgroundColor: Tokens.colors.surface,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  challengeBtnText: {
    ...Typography.labelSm,
    color: Tokens.colors.text,
  },
  boldText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
});
