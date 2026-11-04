import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Trophy } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
import { Card } from '@/components/ui';
import type {
  AmericanoStanding,
  PrizePoolData,
} from '../hooks/useLeagueStandings';

export interface LeagueSidebarCardsProps {
  prizePool?: PrizePoolData;
  americanoStandings?: AmericanoStanding[];
}

export function LeagueSidebarCards({
  prizePool,
  americanoStandings,
}: LeagueSidebarCardsProps) {
  return (
    <>
      {prizePool && (
        <Card style={styles.prizeCard}>
          <View style={styles.prizeHeader}>
            <View>
              <Text style={styles.prizeEyebrow}>Accra Metro Circuit Prize Pool</Text>
              <Text style={[styles.prizeTotalAmount, Typography.tabularNums]}>
                {prizePool.total}
              </Text>
            </View>
            <View style={styles.prizeTrophyBox}>
              <Trophy size={22} color={Tokens.colors.goldText} />
            </View>
          </View>

          <Text style={styles.prizeDescription}>
            Powered by Accra Padel Club sponsors. Winner takes{' '}
            <Text style={styles.boldText}>{prizePool.firstPlace}</Text> + official Padel Ghana crystal trophy and seed in the West Africa Cup.
          </Text>

          <View style={styles.prizeTiersRow}>
            <View style={styles.prizeTierBox}>
              <Text style={styles.tierRankLabel}>1st Place</Text>
              <Text style={[styles.tierAmount, Typography.tabularNums]}>
                {prizePool.firstPlace}
              </Text>
            </View>
            <View style={styles.prizeTierBox}>
              <Text style={styles.tierRankLabel}>2nd Place</Text>
              <Text style={[styles.tierAmount, Typography.tabularNums]}>
                {prizePool.secondPlace}
              </Text>
            </View>
            <View style={styles.prizeTierBox}>
              <Text style={styles.tierRankLabel}>3rd Place</Text>
              <Text style={[styles.tierAmount, Typography.tabularNums]}>
                {prizePool.thirdPlace}
              </Text>
            </View>
          </View>

          <View style={styles.prizeSponsorsRow}>
            <Text style={styles.sponsorsLabel}>Supported by</Text>
            <Text style={styles.sponsorsList}>{prizePool.sponsors}</Text>
          </View>
        </Card>
      )}

      {americanoStandings && (
        <Card style={styles.americanoCard}>
          <View style={styles.americanoHeader}>
            <View>
              <Text style={styles.cardHeaderTitle}>Americano Weekly Standings</Text>
              <Text style={styles.cardHeaderSubtitle}>
                Points across East Legon & Cantonments rollups
              </Text>
            </View>
            <View style={styles.weekPill}>
              <Text style={styles.weekPillText}>Week 6</Text>
            </View>
          </View>

          <View style={styles.americanoList}>
            {americanoStandings.map((p) => {
              const isGold = p.rank === 1;
              return (
                <View
                  key={p.rank}
                  style={[
                    styles.americanoItem,
                    isGold && styles.americanoItemGold,
                  ]}
                >
                  <View style={styles.americanoLeft}>
                    <View
                      style={[
                        styles.americanoRankBadge,
                        isGold && styles.americanoRankBadgeGold,
                      ]}
                    >
                      <Text
                        style={[
                          styles.americanoRankText,
                          isGold && styles.americanoRankTextGold,
                          Typography.tabularNums,
                        ]}
                      >
                        {p.rank}
                      </Text>
                    </View>
                    {p.avatarUrl ? (
                      <Image
                        source={{ uri: p.avatarUrl }}
                        style={styles.americanoAvatarImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.americanoAvatar}>
                        <Text style={styles.americanoAvatarText}>{p.avatarInitials}</Text>
                      </View>
                    )}
                    <View style={styles.americanoPlayerCol}>
                      <Text style={styles.americanoPlayerName}>{p.name}</Text>
                      <Text style={styles.americanoPlayerClub} numberOfLines={1}>
                        {p.club}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.americanoRight}>
                    <Text style={[styles.americanoPointsText, Typography.tabularNums]}>
                      {p.points} pts
                    </Text>
                    <Text style={[styles.americanoDeltaText, Typography.tabularNums]}>
                      +{p.weeklyDelta} this wk
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          <TouchableOpacity style={styles.joinAmericanoBtn} activeOpacity={0.8}>
            <Text style={styles.joinAmericanoBtnText}>
              Join Friday Americano Session (GH₵ 85.00)
            </Text>
          </TouchableOpacity>
        </Card>
      )}

      <Card style={styles.rulesCard}>
        <Text style={styles.rulesNoteTitle}>Scoring & Tie-break System</Text>
        <Text style={styles.rulesNoteBody}>
          Win: 3 pts | Played Loss: 1 pt | Walkover Loss: 0 pts{'\n'}
          Tiebreak: Points, Head-to-Head, Set Diff, Game Diff{'\n'}
          Top pairs promoted up; bottom pairs relegated at cycle end.
        </Text>
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  cardHeaderTitle: {
    ...Typography.headlineSm,
    color: Tokens.colors.text,
  },
  cardHeaderSubtitle: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  prizeCard: {
    padding: Tokens.spacing.base,
    gap: Tokens.spacing.sm,
  },
  prizeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  prizeEyebrow: {
    ...Typography.labelSm,
    color: Tokens.colors.textMuted,
    textTransform: 'uppercase',
  },
  prizeTotalAmount: {
    ...Typography.headlineLg,
    color: Tokens.colors.text,
  },
  prizeTrophyBox: {
    width: 40,
    height: 40,
    borderRadius: Tokens.radii.card,
    backgroundColor: Tokens.colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prizeDescription: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
    lineHeight: Tokens.lineHeight.sm,
  },
  boldText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.text,
  },
  prizeTiersRow: {
    flexDirection: 'row',
    gap: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
  },
  prizeTierBox: {
    flex: 1,
    padding: Tokens.spacing.sm,
    backgroundColor: Tokens.colors.surfaceMuted,
    borderRadius: Tokens.radii.sm,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    alignItems: 'center',
    gap: 2,
  },
  tierRankLabel: {
    ...Typography.labelSm,
    color: Tokens.colors.textMuted,
  },
  tierAmount: {
    ...Typography.labelMd,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  prizeSponsorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    paddingTop: Tokens.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Tokens.colors.border,
    flexWrap: 'wrap',
  },
  sponsorsLabel: {
    ...Typography.labelSm,
    color: Tokens.colors.textMuted,
    textTransform: 'uppercase',
    fontSize: Tokens.fontSize.xs,
  },
  sponsorsList: {
    ...Typography.bodySm,
    color: Tokens.colors.text,
  },
  americanoCard: {
    padding: Tokens.spacing.base,
    gap: Tokens.spacing.base,
  },
  americanoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  weekPill: {
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: Tokens.radii.chip,
    backgroundColor: Tokens.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  weekPillText: {
    ...Typography.labelSm,
    color: Tokens.colors.text,
  },
  americanoList: {
    gap: Tokens.spacing.sm,
  },
  americanoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Tokens.spacing.sm,
    backgroundColor: Tokens.colors.surface,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  americanoItemGold: {
    borderColor: Tokens.colors.gold,
  },
  americanoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
    flex: 1,
  },
  americanoRankBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Tokens.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  americanoRankBadgeGold: {
    backgroundColor: Tokens.colors.gold,
  },
  americanoRankText: {
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.textMuted,
  },
  americanoRankTextGold: {
    color: Tokens.colors.goldText,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  americanoAvatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  americanoAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Tokens.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  americanoAvatarText: {
    ...Typography.labelSm,
    color: Tokens.colors.text,
  },
  americanoPlayerCol: {
    flex: 1,
    gap: 1,
  },
  americanoPlayerName: {
    ...Typography.labelMd,
    color: Tokens.colors.text,
  },
  americanoPlayerClub: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  americanoRight: {
    alignItems: 'flex-end',
    gap: 1,
  },
  americanoPointsText: {
    ...Typography.labelMd,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  americanoDeltaText: {
    ...Typography.bodySm,
    color: Tokens.colors.greenText,
    fontSize: Tokens.fontSize.xs,
  },
  joinAmericanoBtn: {
    paddingVertical: Tokens.spacing.sm,
    alignItems: 'center',
    borderRadius: Tokens.radii.card,
    backgroundColor: Tokens.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  joinAmericanoBtnText: {
    ...Typography.labelSm,
    color: Tokens.colors.text,
  },
  rulesCard: {
    padding: Tokens.spacing.base,
    gap: Tokens.spacing.xs,
  },
  rulesNoteTitle: {
    ...Typography.labelMd,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  rulesNoteBody: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
    lineHeight: Tokens.lineHeight.base,
  },
});
