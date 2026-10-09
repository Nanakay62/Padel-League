import React from 'react';
import {
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Share2, TriangleAlert } from 'lucide-react-native';
import { Tokens } from '@/constants/theme';

export interface VenueMetricsData {
  venue_id: string;
  venue_name: string;
  court_hours_used: number;
  capacity_hours: number;
  fill_rate_percent: number;
  confirmed_players: number;
  waitlist_demand: number;
  new_players_count: number;
  total_revenue_pesewas: number;
  total_revenue_ghs: number;
  unreported_matches_count: number;
  whatsapp_summary: string;
}

interface ClubDashboardViewProps {
  metrics: VenueMetricsData;
}

export function ClubDashboardView({ metrics }: ClubDashboardViewProps) {
  const handleShareWhatsApp = async () => {
    try {
      await Share.share({
        message: metrics.whatsapp_summary,
        title: `${metrics.venue_name} Weekly Summary`,
      });
    } catch {
      // User cancelled share
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.venueTitle}>{metrics.venue_name}</Text>
      <Text style={styles.dashboardSubtitle}>Club Executive KPI Dashboard</Text>

      {/* KPI Cards Grid */}
      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.cardValue}>{metrics.fill_rate_percent.toFixed(1)}%</Text>
          <Text style={styles.cardLabel}>Fill Rate</Text>
          <Text style={styles.cardSub}>
            {metrics.court_hours_used.toFixed(1)} / {metrics.capacity_hours.toFixed(1)} hrs
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardValue}>₵ {metrics.total_revenue_ghs.toLocaleString()}</Text>
          <Text style={styles.cardLabel}>Settlement Revenue</Text>
          <Text style={styles.cardSub}>{metrics.confirmed_players} confirmed seats</Text>
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardValue, { color: Tokens.colors.goldText }]}>
            {metrics.waitlist_demand}
          </Text>
          <Text style={styles.cardLabel}>Unmet Demand</Text>
          <Text style={styles.cardSub}>Waitlisted players</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardValue}>{metrics.new_players_count}</Text>
          <Text style={styles.cardLabel}>New Players</Text>
          <Text style={styles.cardSub}>Brought to venue</Text>
        </View>
      </View>

      {metrics.unreported_matches_count > 0 && (
        <View style={styles.warningBanner}>
          <TriangleAlert size={16} color={Tokens.colors.goldText} />
          <Text style={styles.warningText}>
            {metrics.unreported_matches_count} matches have pending/unreported scores!
          </Text>
        </View>
      )}

      {/* WhatsApp Share Action */}
      <TouchableOpacity
        style={styles.shareWhatsAppButton}
        onPress={handleShareWhatsApp}
        accessibilityRole="button"
        accessibilityLabel="Share Weekly Summary to WhatsApp"
      >
        <View style={styles.buttonInnerRow}>
          <Share2 size={16} color={Tokens.colors.primaryForeground} />
          <Text style={styles.shareWhatsAppText}>Share Weekly Summary to WhatsApp</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Tokens.colors.surface,
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.md,
    marginVertical: Tokens.spacing.sm,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
  },
  venueTitle: {
    fontSize: Tokens.fontSize.xl,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.text,
  },
  dashboardSubtitle: {
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.textMuted,
    marginBottom: Tokens.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.sm,
    marginBottom: Tokens.spacing.md,
  },
  card: {
    flexBasis: '48%',
    backgroundColor: Tokens.colors.surfaceMuted,
    borderRadius: Tokens.radii.sm,
    padding: Tokens.spacing.sm,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
  },
  cardValue: {
    fontSize: Tokens.fontSize.xl,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.primaryText,
    fontVariant: ['tabular-nums'],
    marginBottom: Tokens.spacing.xs,
  },
  cardLabel: {
    fontSize: Tokens.fontSize.xs,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.text,
  },
  cardSub: {
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.textMuted,
    marginTop: Tokens.spacing.xs,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    backgroundColor: Tokens.colors.goldLight,
    borderRadius: Tokens.radii.sm,
    padding: Tokens.spacing.sm,
    marginBottom: Tokens.spacing.md,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.goldBorder,
  },
  warningText: {
    color: Tokens.colors.goldText,
    fontSize: Tokens.fontSize.xs,
    fontWeight: Tokens.fontWeight.semibold,
    flex: 1,
  },
  shareWhatsAppButton: {
    backgroundColor: Tokens.colors.primary,
    minHeight: Tokens.dimensions.minTouchTarget,
    paddingVertical: Tokens.spacing.sm,
    borderRadius: Tokens.radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  shareWhatsAppText: {
    color: Tokens.colors.primaryForeground,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.sm,
  },
});
