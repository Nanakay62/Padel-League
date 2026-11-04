import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { MapPin, Clock, Users } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
import { getPlaytomicBand } from '@/constants/designSystem';
import { formatGhanaCedis } from '@/lib/formatting';
import { t } from '@/lib/i18n';
import { Button, Card, EmptyState } from '@/components/ui';
import {
  type OpenMatchItem,
  filterMatchesAtPlayerLevel,
  calculateSeatFeePesewas,
} from '../utils/playTonightUtils';

export interface PlayTonightFeedProps {
  matches: OpenMatchItem[];
  userRating: number;
  onSelectMatch: (match: OpenMatchItem) => void;
  isDesktop?: boolean;
}

export function PlayTonightFeed({
  matches,
  userRating,
  onSelectMatch,
  isDesktop = false,
}: PlayTonightFeedProps) {
  const [filterAtMyLevel, setFilterAtMyLevel] = useState(true);

  const displayedMatches = filterMatchesAtPlayerLevel(
    matches,
    userRating,
    filterAtMyLevel ? 0.5 : null
  );

  return (
    <View style={styles.container}>
      {/* Header and Level Toggle */}
      <View style={styles.headerRow}>
        <View style={styles.titleColumn}>
          <Text style={styles.sectionTitle}>{t('playTonightTitle')}</Text>
          <Text style={styles.sectionSubtitle}>{t('playTonightSubtitle')}</Text>
        </View>

        <View style={styles.pillSelector}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('filterAtMyLevel')}
            onPress={() => setFilterAtMyLevel(true)}
            style={[styles.pill, filterAtMyLevel && styles.pillActive]}
          >
            <Text
              style={[styles.pillText, filterAtMyLevel && styles.pillTextActive]}
            >
              {t('filterAtMyLevel')}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('filterAllLevels')}
            onPress={() => setFilterAtMyLevel(false)}
            style={[styles.pill, !filterAtMyLevel && styles.pillActive]}
          >
            <Text
              style={[
                styles.pillText,
                !filterAtMyLevel && styles.pillTextActive,
              ]}
            >
              {t('filterAllLevels')}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Matches Grid or Empty State */}
      {displayedMatches.length === 0 ? (
        <EmptyState
          title="No open matches at your level tonight"
          message="Try toggling to All Levels to view all community games in Accra."
          actionTitle="Show All Levels"
          onActionPress={() => setFilterAtMyLevel(false)}
        />
      ) : (
        <View style={[styles.matchesGrid, isDesktop && styles.matchesGridDesktop]}>
          {displayedMatches.map((match) => {
            const openSpots = match.totalSeats - match.confirmedPlayers.length;
            const perSeatFee = calculateSeatFeePesewas(
              match.courtCostPesewas,
              match.totalSeats
            );
            const levelBand = getPlaytomicBand(match.targetLevel);

            return (
              <Card
                key={match.id}
                style={[styles.matchCard, isDesktop && styles.matchCardDesktop]}
              >
                {/* Match Card Header: Title & Time */}
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.matchTitle}>{match.title}</Text>
                  <View style={styles.timeBadge}>
                    <Clock size={12} color={Tokens.colors.muted} />
                    <Text style={styles.timeText}>{match.timeDisplay}</Text>
                  </View>
                </View>

                {/* Venue & Court Details */}
                <View style={styles.locationRow}>
                  <MapPin size={14} color={Tokens.colors.muted} />
                  <Text style={styles.locationText}>
                    {match.venueName} • {match.courtName}
                  </Text>
                </View>

                {/* Level Chip */}
                <View style={styles.levelRow}>
                  <View
                    style={[
                      styles.levelBadge,
                      { backgroundColor: levelBand.badgeBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.levelBadgeText,
                        { color: levelBand.badgeText },
                      ]}
                    >
                      {t(levelBand.labelKey)} {match.targetLevel.toFixed(1)}
                    </Text>
                  </View>
                </View>

                {/* Footer: Spots Open, Fee, and Join Button */}
                <View style={styles.cardFooterRow}>
                  <View style={styles.quotaBox}>
                    <Users size={14} color={Tokens.colors.muted} />
                    <Text style={styles.quotaText}>
                      {t('spotsOpenLabel', { count: openSpots })}
                    </Text>
                  </View>

                  <View style={styles.actionBox}>
                    <View style={styles.priceBox}>
                      <Text style={styles.priceAmount}>
                        {formatGhanaCedis(perSeatFee)}
                      </Text>
                      <Text style={styles.priceUnit}>{t('perPlayerLabel')}</Text>
                    </View>
                    <Button
                      title="Join"
                      size="sm"
                      variant="primary"
                      onPress={() => onSelectMatch(match)}
                      testID={`join-match-${match.id}`}
                    />
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Tokens.spacing.lg,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: Tokens.spacing.sm,
    marginBottom: Tokens.spacing.base,
  },
  titleColumn: {
    flex: 1,
    minWidth: 200,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.display,
    fontSize: Tokens.fontSize.xl,
    lineHeight: Tokens.lineHeight.xl,
    fontWeight: Tokens.fontWeight.bold,
    color: Tokens.colors.text,
  },
  sectionSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.textMuted,
    marginTop: Tokens.spacing.xs,
  },
  pillSelector: {
    flexDirection: 'row',
    backgroundColor: Tokens.colors.surfaceMuted,
    borderRadius: Tokens.radii.pill,
    padding: 2,
  },
  pill: {
    paddingHorizontal: Tokens.spacing.md,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.pill,
  },
  pillActive: {
    backgroundColor: Tokens.colors.ink,
  },
  pillText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.textMuted,
  },
  pillTextActive: {
    color: Tokens.colors.onInk,
    fontWeight: Tokens.fontWeight.semibold,
  },
  matchesGrid: {
    gap: Tokens.spacing.base,
  },
  matchesGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  matchCard: {
    backgroundColor: Tokens.colors.card,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    padding: Tokens.spacing.base,
  },
  matchCardDesktop: {
    flex: 1,
    minWidth: 320,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Tokens.spacing.xs,
  },
  matchTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    color: Tokens.colors.text,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    backgroundColor: Tokens.colors.surfaceMuted,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: Tokens.radii.xs,
  },
  timeText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.textMuted,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    marginBottom: Tokens.spacing.sm,
  },
  locationText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.textMuted,
  },
  levelRow: {
    marginBottom: Tokens.spacing.md,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: Tokens.radii.chip,
    borderWidth: 1,
    borderColor: Tokens.colors.line,
  },
  levelBadgeText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Tokens.colors.line,
    paddingTop: Tokens.spacing.md,
    marginTop: Tokens.spacing.xs,
  },
  quotaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  quotaText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.textMuted,
  },
  actionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.md,
  },
  priceBox: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontFamily: Typography.fontFamily.display,
    fontWeight: Tokens.fontWeight.bold,
    fontSize: Tokens.fontSize.base,
    color: Tokens.colors.text,
  },
  priceUnit: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.xxs,
    color: Tokens.colors.textMuted,
  },
});
