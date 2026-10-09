import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { TrendingUp, Award, Activity } from 'lucide-react-native';
import { Tokens, Typography, useResponsiveLayout } from '@/constants/theme';
import { Card, StatusPill, Chip } from '@/components/ui';

export interface RatingEventHistoryItem {
  id: string;
  match_id: string;
  rating_before: number;
  rating_after: number;
  delta: number;
  k_factor: number;
  explanation: string;
  created_at: string;
}

export interface RatingHistoryData {
  user_id: string;
  current_rating: number;
  level_band: string;
  is_provisional: boolean;
  history: RatingEventHistoryItem[];
}

interface RatingHistoryScreenProps {
  data: RatingHistoryData;
}

const LEVEL_BANDS = [
  { name: 'Beginner', range: '1.0 – 2.0', desc: 'Learning walls and basic technique' },
  { name: 'Improver', range: '2.0 – 3.0', desc: 'Consistent baseline rallies & glass play' },
  { name: 'Intermediate', range: '3.0 – 4.0', desc: 'Tactical lobs & net control' },
  { name: 'Advanced', range: '4.0 – 5.5', desc: 'Fast-paced, vibora, offensive smashes' },
  { name: 'Expert', range: '5.5 – 7.0', desc: 'National & tournament elite' },
];

export function RatingHistoryScreen({ data }: RatingHistoryScreenProps) {
  const { isDesktop, margin, gutter, maxContentWidth } = useResponsiveLayout();
  const [selectedTab, setSelectedTab] = useState('ALL');

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: margin,
          maxWidth: maxContentWidth,
          gap: gutter,
        },
      ]}
    >
      {/* Top Circuit Subheader Banner */}
      <View style={styles.circuitHeader}>
        <View style={styles.circuitBadgeRow}>
          <View style={styles.circuitStatusPill}>
            <Text style={styles.circuitStatusText}>Official Accra Ladder 2026</Text>
          </View>
          <Text style={styles.circuitUpdateText}>GPR Rating Engine</Text>
        </View>
        <Text style={[styles.headerTitle, isDesktop && styles.headerTitleDesktop]}>
          Padel Ghana Official Player Rankings
        </Text>
        <Text style={styles.headerSubtitle}>
          Dynamic Playtomic-aligned rating system based on verified match results in Accra tournaments, Americanos, and ladder games.
        </Text>
      </View>

      {/* Category Tabs */}
      <View style={styles.filterRow}>
        {['ALL', 'MEN', 'WOMEN', 'MIXED', 'CLUBS'].map((tab) => (
          <Chip
            key={tab}
            label={tab === 'ALL' ? 'All Players' : tab}
            selected={selectedTab === tab}
            onPress={() => setSelectedTab(tab)}
          />
        ))}
      </View>

      {/* User's Personal Rating Card (Mica Flat Style) */}
      <Card style={styles.personalRatingCard}>
        <View style={styles.playerMetaRow}>
          <View style={styles.playerAvatar}>
            <Text style={styles.avatarInitial}>
              {data.user_id.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.playerDetails}>
            <View style={styles.playerNameRow}>
              <Text style={styles.playerNameText}>Nana K.</Text>
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>You</Text>
              </View>
            </View>
            <Text style={styles.playerClubText}>Accra Padel Club • Airport Residential</Text>
          </View>
        </View>

        <View style={styles.ratingMetricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Dynamic Rating</Text>
            <View style={styles.ratingNumberRow}>
              <Text style={[styles.ratingNumberText, Typography.tabularNums]}>
                {data.current_rating.toFixed(2)}
              </Text>
              <View style={styles.deltaPill}>
                <TrendingUp size={12} color={Tokens.colors.greenText} strokeWidth={1.75} />
                <Text style={[styles.deltaText, Typography.tabularNums]}>+0.18 this month</Text>
              </View>
            </View>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>City Standing</Text>
            <View style={styles.standingRow}>
              <Text style={[styles.standingNumber, Typography.tabularNums]}>#14</Text>
              <Text style={styles.standingSubtext}>in Greater Accra</Text>
            </View>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Status</Text>
            <View style={styles.statusPillWrapper}>
              <StatusPill
                label={data.is_provisional ? 'Provisional' : 'Established'}
                variant={data.is_provisional ? 'gold' : 'success'}
              />
            </View>
          </View>
        </View>

        {/* 4 Key Performance Stats */}
        <View style={styles.statsTilesGrid}>
          <View style={styles.statTile}>
            <Text style={styles.statTileLabel}>Matches Played</Text>
            <Text style={[styles.statTileValue, Typography.tabularNums]}>38</Text>
            <Text style={styles.statTileSubtext}>28 Verified Doubles</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statTileLabel}>Win Rate</Text>
            <Text style={[styles.statTileValue, Typography.tabularNums]}>64.2%</Text>
            <Text style={styles.statTileGreenSubtext}>24W - 14L</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statTileLabel}>Americano High</Text>
            <Text style={[styles.statTileValue, Typography.tabularNums]}>32 pts</Text>
            <Text style={styles.statTileSubtext}>East Legon Open</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statTileLabel}>Preferred Side</Text>
            <Text style={styles.statTileValue}>Backhand</Text>
            <Text style={styles.statTileSubtext}>Left Court Master</Text>
          </View>
        </View>
      </Card>

      {/* Responsive Section Layout: Guide & Progression Log */}
      <View style={isDesktop ? styles.desktopColumnsRow : styles.mobileColumnsCol}>
        {/* Rating Progression History */}
        <View style={isDesktop ? styles.desktopLeftCol : styles.fullWidthCol}>
          <View style={styles.sectionHeaderRow}>
            <Activity size={16} color={Tokens.colors.text} strokeWidth={1.75} />
            <Text style={styles.sectionTitle}>Rating Event Progression History</Text>
          </View>

          {data.history.length === 0 ? (
            <Card style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No rated matches recorded yet.</Text>
            </Card>
          ) : (
            <FlatList
              data={[...data.history].reverse()}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const isPositive = item.delta >= 0;
                return (
                  <Card style={styles.historyCard}>
                    <View style={styles.historyTopRow}>
                      <View style={styles.ratingChangeRow}>
                        <Text style={[styles.ratingChangeText, Typography.tabularNums]}>
                          {item.rating_before.toFixed(2)} to {item.rating_after.toFixed(2)}
                        </Text>
                        <Text style={styles.matchTagText}>Match {item.match_id}</Text>
                      </View>
                      <StatusPill
                        label={isPositive ? `+${item.delta.toFixed(2)}` : item.delta.toFixed(2)}
                        variant={isPositive ? 'success' : 'danger'}
                      />
                    </View>

                    <Text style={styles.explanationText}>{item.explanation}</Text>

                    <View style={styles.historyFooter}>
                      <Text style={[styles.kFactorText, Typography.tabularNums]}>
                        Weight K={item.k_factor.toFixed(2)}
                      </Text>
                      <Text style={[styles.dateText, Typography.tabularNums]}>
                        {item.created_at.split('T')[0]}
                      </Text>
                    </View>
                  </Card>
                );
              }}
            />
          )}
        </View>

        {/* Level Bands Guide Table */}
        <View style={isDesktop ? styles.desktopRightCol : styles.fullWidthCol}>
          <View style={styles.sectionHeaderRow}>
            <Award size={16} color={Tokens.colors.text} strokeWidth={1.75} />
            <Text style={styles.sectionTitle}>Level Bands Guide</Text>
          </View>

          <Card style={styles.bandsTable}>
            {LEVEL_BANDS.map((band) => {
              const isCurrent = band.name.toLowerCase() === data.level_band.toLowerCase();
              return (
                <View key={band.name} style={[styles.bandRow, isCurrent && styles.activeBandRow]}>
                  <View style={styles.bandHeaderRow}>
                    <View style={styles.bandTitleGroup}>
                      <Text style={[styles.bandName, isCurrent && styles.activeBandText]}>
                        {band.name}
                      </Text>
                      <Text style={[styles.bandRange, Typography.tabularNums]}>
                        ({band.range})
                      </Text>
                    </View>
                    {isCurrent && (
                      <StatusPill label="Current" variant="success" />
                    )}
                  </View>
                  <Text style={styles.bandDesc}>{band.desc}</Text>
                </View>
              );
            })}
          </Card>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Tokens.spacing.base,
    paddingBottom: Tokens.spacing.xxxl + 32,
    width: '100%',
    alignSelf: 'center',
  },
  circuitHeader: {
    gap: Tokens.spacing.xs,
  },
  circuitBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
  circuitStatusPill: {
    backgroundColor: Tokens.colors.primaryLight,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: Tokens.radii.chip,
  },
  circuitStatusText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.greenText,
  },
  circuitUpdateText: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xl,
    lineHeight: Tokens.lineHeight.xl,
    color: Tokens.colors.text,
  },
  headerTitleDesktop: {
    fontSize: Tokens.fontSize.xxl,
    lineHeight: Tokens.lineHeight.xxl,
  },
  headerSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textMuted,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.xs,
  },
  personalRatingCard: {
    backgroundColor: Tokens.colors.card,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    padding: Tokens.spacing.lg,
    gap: Tokens.spacing.md,
  },
  playerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.md,
    paddingBottom: Tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.colors.border,
  },
  playerAvatar: {
    width: 44,
    height: 44,
    borderRadius: Tokens.radii.pill,
    backgroundColor: Tokens.colors.background,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    color: Tokens.colors.text,
  },
  playerDetails: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  playerNameText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    color: Tokens.colors.text,
  },
  youBadge: {
    backgroundColor: Tokens.colors.background,
    paddingHorizontal: Tokens.spacing.xs,
    paddingVertical: 1,
    borderRadius: Tokens.radii.chip,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  youBadgeText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  playerClubText: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  ratingMetricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Tokens.spacing.lg,
  },
  metricItem: {
    gap: Tokens.spacing.xs,
  },
  metricLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  ratingNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Tokens.spacing.sm,
  },
  ratingNumberText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.display,
    lineHeight: Tokens.lineHeight.display,
    color: Tokens.colors.text,
  },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Tokens.colors.primaryLight,
    paddingHorizontal: Tokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: Tokens.radii.chip,
  },
  deltaText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.greenText,
  },
  metricDivider: {
    width: 1,
    height: 36,
    backgroundColor: Tokens.colors.border,
  },
  standingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Tokens.spacing.xs,
  },
  standingNumber: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xl,
    lineHeight: Tokens.lineHeight.xl,
    color: Tokens.colors.text,
  },
  standingSubtext: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  statusPillWrapper: {
    paddingTop: 2,
  },
  statsTilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.sm,
    paddingTop: Tokens.spacing.xs,
  },
  statTile: {
    flex: 1,
    minWidth: 120,
    backgroundColor: Tokens.colors.background,
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.sm,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    justifyContent: 'space-between',
  },
  statTileLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  statTileValue: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    color: Tokens.colors.text,
    marginVertical: 2,
  },
  statTileSubtext: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  statTileGreenSubtext: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.greenText,
  },
  desktopColumnsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Tokens.spacing.base,
  },
  mobileColumnsCol: {
    flexDirection: 'column',
    gap: Tokens.spacing.base,
  },
  desktopLeftCol: {
    flex: 3,
    gap: Tokens.spacing.sm,
  },
  desktopRightCol: {
    flex: 2,
    gap: Tokens.spacing.sm,
  },
  fullWidthCol: {
    width: '100%',
    gap: Tokens.spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    marginBottom: Tokens.spacing.xs,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    color: Tokens.colors.text,
  },
  bandsTable: {
    padding: 0,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    overflow: 'hidden',
  },
  bandRow: {
    padding: Tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.colors.border,
    gap: 2,
  },
  activeBandRow: {
    backgroundColor: Tokens.colors.background,
  },
  bandHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bandTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  bandName: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
  },
  bandRange: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  activeBandText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.greenText,
  },
  bandDesc: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  emptyState: {
    padding: Tokens.spacing.xl,
    alignItems: 'center',
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  emptyStateText: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textMuted,
  },
  historyCard: {
    marginBottom: Tokens.spacing.sm,
    gap: Tokens.spacing.xs,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingChangeRow: {
    gap: 2,
  },
  ratingChangeText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
  },
  matchTagText: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  explanationText: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Tokens.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Tokens.colors.border,
    marginTop: Tokens.spacing.xs,
  },
  kFactorText: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  dateText: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
});
