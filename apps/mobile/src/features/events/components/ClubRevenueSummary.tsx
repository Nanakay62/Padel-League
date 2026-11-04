import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Download, CheckCircle, Wallet, Users } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
import { formatGhanaCedis } from '@/lib/formatting';
import { Button } from '@/components/ui';
import { calculateClubEventRevenue } from '../utils/courtsideUtils';

export interface ClubRevenueSummaryProps {
  eventName: string;
  maxCapacity: number;
  confirmedPlayersCount: number;
  feePerPlayerPesewas: number;
  courtCostPesewas: number;
  platformFeeRate: number;
  onExportCsv?: () => void;
}

export function ClubRevenueSummary({
  eventName,
  maxCapacity,
  confirmedPlayersCount,
  feePerPlayerPesewas,
  courtCostPesewas,
  platformFeeRate,
  onExportCsv,
}: ClubRevenueSummaryProps) {
  const revenue = calculateClubEventRevenue({
    confirmedPlayersCount,
    feePerPlayerPesewas,
    courtCostPesewas,
    platformFeeRate,
  });

  const fillPercent =
    maxCapacity > 0
      ? Math.round((confirmedPlayersCount / maxCapacity) * 100)
      : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextCol}>
          <Text style={styles.sectionEyebrow}>ORGANIZER BACK OFFICE</Text>
          <Text style={styles.eventName}>{eventName}</Text>
        </View>
        {onExportCsv ? (
          <Button
            title="Export CSV"
            size="sm"
            variant="secondary"
            icon={<Download size={14} color={Tokens.colors.text} />}
            onPress={onExportCsv}
            testID="export-csv-btn"
          />
        ) : null}
      </View>

      {/* KPI Tiles Grid */}
      <View style={styles.kpiGrid}>
        {/* Fill Rate Tile */}
        <View style={styles.kpiTile}>
          <View style={styles.kpiTileHeader}>
            <Users size={16} color={Tokens.colors.muted} />
            <Text style={styles.kpiLabel}>EVENT FILL-RATE</Text>
          </View>
          <Text style={styles.kpiValue}>
            {confirmedPlayersCount}/{maxCapacity} ({fillPercent}%)
          </Text>
        </View>

        {/* Gross Revenue Tile */}
        <View style={styles.kpiTile}>
          <View style={styles.kpiTileHeader}>
            <Wallet size={16} color={Tokens.colors.muted} />
            <Text style={styles.kpiLabel}>GROSS REVENUE</Text>
          </View>
          <Text style={styles.kpiValue}>
            {formatGhanaCedis(revenue.totalGrossPesewas)}
          </Text>
        </View>
      </View>

      {/* Financial Split Breakdown Card */}
      <View style={styles.breakdownCard}>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Court Fees Collected</Text>
          <Text style={styles.breakdownAmount}>
            {formatGhanaCedis(revenue.totalGrossPesewas)}
          </Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Platform Fee</Text>
          <Text style={styles.breakdownAmountMuted}>
            -{formatGhanaCedis(revenue.platformFeePesewas)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.breakdownRow}>
          <Text style={styles.netLabel}>Net Club Payout</Text>
          <Text style={styles.netAmount}>
            {formatGhanaCedis(revenue.netClubPayoutPesewas)}
          </Text>
        </View>

        {/* Audit Trail Badge */}
        <View style={styles.auditBadge}>
          <CheckCircle size={14} color={Tokens.colors.greenText} />
          <Text style={styles.auditText}>
            AuditLog Verified • Integer Pesewas (GHS)
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Tokens.colors.card,
    borderRadius: Tokens.radii.cardLg,
    padding: Tokens.spacing.lg,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    gap: Tokens.spacing.base,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextCol: {
    flex: 1,
  },
  sectionEyebrow: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.muted,
    letterSpacing: 1.0,
  },
  eventName: {
    fontFamily: Typography.fontFamily.display,
    fontSize: Tokens.fontSize.lg,
    fontWeight: Tokens.fontWeight.bold,
    color: Tokens.colors.text,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: Tokens.spacing.base,
  },
  kpiTile: {
    flex: 1,
    backgroundColor: Tokens.colors.chalk,
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.base,
    borderWidth: 1,
    borderColor: Tokens.colors.line,
    gap: Tokens.spacing.xs,
  },
  kpiTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  kpiLabel: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xxs,
    color: Tokens.colors.muted,
    letterSpacing: 0.8,
  },
  kpiValue: {
    fontFamily: Typography.fontFamily.display,
    fontSize: Tokens.fontSize.xl,
    fontWeight: Tokens.fontWeight.bold,
    color: Tokens.colors.text,
  },
  breakdownCard: {
    backgroundColor: Tokens.colors.chalk,
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.base,
    borderWidth: 1,
    borderColor: Tokens.colors.line,
    gap: Tokens.spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.sm,
    color: Tokens.colors.text,
  },
  breakdownAmount: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Tokens.fontSize.sm,
    color: Tokens.colors.text,
  },
  breakdownAmountMuted: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Tokens.fontSize.sm,
    color: Tokens.colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Tokens.colors.line,
    marginVertical: Tokens.spacing.xs,
  },
  netLabel: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    color: Tokens.colors.text,
  },
  netAmount: {
    fontFamily: Typography.fontFamily.display,
    fontWeight: Tokens.fontWeight.bold,
    fontSize: Tokens.fontSize.lg,
    color: Tokens.colors.text,
  },
  auditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    marginTop: Tokens.spacing.xs,
  },
  auditText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.xxs,
    color: Tokens.colors.greenText,
  },
});
