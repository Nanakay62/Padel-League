import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Tokens, Typography } from '@/constants/theme';
import { Card, StatusPill } from '@/components/ui';

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
  return (
    <View style={styles.container}>
      {/* Current Rating Hero Card */}
      <Card style={styles.heroCard}>
        <Text style={styles.heroTitle}>Your Ghana Padel Rating</Text>
        <Text style={[styles.ratingNumber, Typography.tabularNums]}>
          {data.current_rating.toFixed(2)}
        </Text>
        <View style={styles.badgeRow}>
          <StatusPill label={data.level_band} variant="neutral" />
          <StatusPill
            label={data.is_provisional ? 'Provisional (< 10 matches)' : 'Established Level'}
            variant={data.is_provisional ? 'gold' : 'success'}
          />
        </View>
      </Card>

      {/* Level Bands Reference Table */}
      <View style={styles.bandsSection}>
        <Text style={styles.sectionTitle}>Level Bands Guide</Text>
        <Card style={styles.bandsTable}>
          {LEVEL_BANDS.map((band) => {
            const isCurrent = band.name.toLowerCase() === data.level_band.toLowerCase();
            return (
              <View key={band.name} style={[styles.bandRow, isCurrent && styles.activeBandRow]}>
                <View style={styles.bandHeaderRow}>
                  <Text style={[styles.bandName, isCurrent && styles.activeBandText]}>
                    {band.name} ({band.range})
                  </Text>
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

      {/* Rating Event Progression History */}
      <Text style={styles.sectionTitle}>Rating History Log</Text>
      {data.history.length === 0 ? (
        <Card style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No rated matches played yet.</Text>
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
                  <Text style={[styles.ratingChangeText, Typography.tabularNums]}>
                    {item.rating_before.toFixed(2)} to {item.rating_after.toFixed(2)}
                  </Text>
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
                  <Text style={styles.dateText}>
                    {item.created_at.split('T')[0]}
                  </Text>
                </View>
              </Card>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Tokens.spacing.base,
  },
  heroCard: {
    alignItems: 'center',
    padding: Tokens.spacing.xl,
    gap: Tokens.spacing.sm,
  },
  heroTitle: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textMuted,
  },
  ratingNumber: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.display,
    lineHeight: Tokens.lineHeight.display,
    color: Tokens.colors.text,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Tokens.spacing.xs,
    marginTop: Tokens.spacing.xs,
  },
  bandsSection: {
    gap: Tokens.spacing.sm,
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
  bandName: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
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
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingChangeText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
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
