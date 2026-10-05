import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PadelBrand } from '@/constants/theme';

export interface OpenMatchCardProps {
  id: string;
  venueName: string;
  courtNumber: number;
  timeSlot: string; // e.g. "Today • 6:00 PM"
  levelBand: string; // e.g. "3.0 – 4.0"
  priceFormatted: string; // e.g. "GH₵ 85"
  openSeats: number;
  capacity: number;
  confirmedPlayers: string[];
  onJoin: (matchId: string) => void;
}

export function OpenMatchCard({
  id,
  venueName,
  courtNumber,
  timeSlot,
  levelBand,
  priceFormatted,
  openSeats,
  capacity = 4,
  confirmedPlayers,
  onJoin,
}: OpenMatchCardProps) {
  const isLookingForFourth = openSeats === 1;

  return (
    <View style={styles.card}>
      {/* Top Badges */}
      <View style={styles.badgeRow}>
        <View
          style={[
            styles.seatsBadge,
            isLookingForFourth && styles.seatsBadgeFourth,
          ]}
        >
          <Text
            style={[
              styles.seatsBadgeText,
              isLookingForFourth && styles.seatsBadgeTextFourth,
            ]}
          >
            {isLookingForFourth
              ? '🎾 LOOKING FOR A FOURTH'
              : `${openSeats} SEATS LEFT`}
          </Text>
        </View>

        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>{levelBand}</Text>
        </View>
      </View>

      {/* Main Details */}
      <Text style={styles.venueTitle}>{venueName}</Text>
      <Text style={styles.courtSubtitle}>
        Court {courtNumber} • {timeSlot}
      </Text>

      {/* Confirmed Players */}
      <View style={styles.playersSection}>
        <Text style={styles.playersLabel}>
          Players ({confirmedPlayers.length}/{capacity}):
        </Text>
        <Text style={styles.playersList} numberOfLines={1}>
          {confirmedPlayers.join(', ')}
        </Text>
      </View>

      {/* Price & Join Action */}
      <View style={styles.footerRow}>
        <View>
          <Text style={styles.costLabel}>Cost per player</Text>
          <Text style={styles.costValue}>{priceFormatted}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.joinBtn,
            openSeats === 0 && styles.joinBtnDisabled,
          ]}
          disabled={openSeats === 0}
          onPress={() => onJoin(id)}
        >
          <Text style={styles.joinBtnText}>
            {openSeats > 0 ? `Join for ${priceFormatted} →` : 'Match Full'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PadelBrand.cardDark,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seatsBadge: {
    backgroundColor: '#1E2C24',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#294333',
  },
  seatsBadgeFourth: {
    backgroundColor: '#372B15',
    borderColor: '#544018',
  },
  seatsBadgeText: {
    color: PadelBrand.electricGreen,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  seatsBadgeTextFourth: {
    color: PadelBrand.gold,
  },
  levelBadge: {
    backgroundColor: '#1C2420',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  levelText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
  },
  venueTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  courtSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 14,
  },
  playersSection: {
    backgroundColor: '#111714',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  playersLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  playersList: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E2824',
  },
  costLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  costValue: {
    color: PadelBrand.electricGreen,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 1,
  },
  joinBtn: {
    backgroundColor: PadelBrand.electricGreen,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  joinBtnDisabled: {
    backgroundColor: '#1E2622',
  },
  joinBtnText: {
    color: '#0B0F0E',
    fontSize: 14,
    fontWeight: '800',
  },
});
