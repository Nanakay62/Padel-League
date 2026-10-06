import React from 'react';
import {
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PadelBrand } from '@/constants/theme';

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
          <Text style={styles.cardValue}>GH₵ {metrics.total_revenue_ghs.toLocaleString()}</Text>
          <Text style={styles.cardLabel}>Settlement Revenue</Text>
          <Text style={styles.cardSub}>{metrics.confirmed_players} confirmed seats</Text>
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardValue, { color: PadelBrand.gold }]}>
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
          <Text style={styles.warningText}>
            ⚠️ {metrics.unreported_matches_count} matches have pending/unreported scores!
          </Text>
        </View>
      )}

      {/* WhatsApp Share Action */}
      <TouchableOpacity style={styles.shareWhatsAppButton} onPress={handleShareWhatsApp}>
        <Text style={styles.shareWhatsAppText}>📲 Share Weekly Summary to WhatsApp</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  venueTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  dashboardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  card: {
    flexBasis: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PadelBrand.electricGreen,
    marginBottom: 2,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  cardSub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  warningBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  warningText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
  },
  shareWhatsAppButton: {
    backgroundColor: '#25D366',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#25D366',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  shareWhatsAppText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
