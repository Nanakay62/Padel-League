import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PadelBrand } from '@/constants/theme';

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
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Your Ghana Padel Rating</Text>
        <Text style={styles.ratingNumber}>{data.current_rating.toFixed(2)}</Text>
        <View style={styles.bandBadge}>
          <Text style={styles.bandBadgeText}>{data.level_band}</Text>
        </View>
        <Text style={styles.reliabilityText}>
          {data.is_provisional ? '🟡 Provisional Level (< 10 matches)' : '🟢 Established Level'}
        </Text>
      </View>

      {/* Level Bands Reference Table */}
      <View style={styles.bandsSection}>
        <Text style={styles.sectionTitle}>Level Bands Guide</Text>
        <View style={styles.bandsTable}>
          {LEVEL_BANDS.map((band) => {
            const isCurrent = band.name.toLowerCase() === data.level_band.toLowerCase();
            return (
              <View key={band.name} style={[styles.bandRow, isCurrent && styles.activeBandRow]}>
                <View style={styles.bandHeaderRow}>
                  <Text style={[styles.bandName, isCurrent && styles.activeBandText]}>
                    {band.name} ({band.range})
                  </Text>
                  {isCurrent && <Text style={styles.currentIndicator}>Current</Text>}
                </View>
                <Text style={styles.bandDesc}>{band.desc}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Rating Event Progression History */}
      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Rating History Log</Text>
      {data.history.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No rated matches played yet.</Text>
        </View>
      ) : (
        <FlatList
          data={[...data.history].reverse()}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isPositive = item.delta >= 0;
            return (
              <View style={styles.historyCard}>
                <View style={styles.historyTopRow}>
                  <Text style={styles.ratingChangeText}>
                    {item.rating_before.toFixed(2)} → {item.rating_after.toFixed(2)}
                  </Text>
                  <View
                    style={[
                      styles.deltaBadge,
                      isPositive ? styles.positiveDeltaBadge : styles.negativeDeltaBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.deltaText,
                        isPositive ? styles.positiveDeltaText : styles.negativeDeltaText,
                      ]}
                    >
                      {isPositive ? `+${item.delta.toFixed(2)}` : item.delta.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.explanationText}>{item.explanation}</Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  heroCard: {
    backgroundColor: PadelBrand.charcoal,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  ratingNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: PadelBrand.electricGreen,
    letterSpacing: -1,
  },
  bandBadge: {
    backgroundColor: '#25302C',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    marginBottom: 8,
  },
  bandBadgeText: {
    color: '#F4C430',
    fontWeight: 'bold',
    fontSize: 13,
  },
  reliabilityText: {
    color: '#D1D5DB',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  bandsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bandsTable: {
    gap: 8,
  },
  bandRow: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  activeBandRow: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  bandHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bandName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#374151',
  },
  activeBandText: {
    color: '#065F46',
  },
  currentIndicator: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#059669',
  },
  bandDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingChangeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  deltaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  positiveDeltaBadge: {
    backgroundColor: '#DCFCE7',
  },
  negativeDeltaBadge: {
    backgroundColor: '#FEE2E2',
  },
  deltaText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  positiveDeltaText: {
    color: '#16A34A',
  },
  negativeDeltaText: {
    color: '#DC2626',
  },
  explanationText: {
    fontSize: 12,
    color: '#4B5563',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
});
