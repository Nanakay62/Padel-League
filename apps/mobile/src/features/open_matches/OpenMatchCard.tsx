import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Tokens } from '@/constants/theme';

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
              ? 'LOOKING FOR A FOURTH'
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
          accessibilityRole="button"
          accessibilityLabel={openSeats > 0 ? `Join for ${priceFormatted}` : 'Match Full'}
        >
          <Text
            style={[
              styles.joinBtnText,
              openSeats === 0 && styles.joinBtnTextDisabled,
            ]}
          >
            {openSeats > 0 ? `Join for ${priceFormatted}` : 'Match Full'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Tokens.colors.surface,
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.md,
    marginBottom: Tokens.spacing.md,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Tokens.spacing.sm,
  },
  seatsBadge: {
    backgroundColor: Tokens.colors.primaryLight,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.sm,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.primaryBorder,
  },
  seatsBadgeFourth: {
    backgroundColor: Tokens.colors.goldLight,
    borderColor: Tokens.colors.goldBorder,
  },
  seatsBadgeText: {
    color: Tokens.colors.primaryText,
    fontSize: Tokens.fontSize.xs,
    fontWeight: Tokens.fontWeight.semibold,
    letterSpacing: 0.5,
  },
  seatsBadgeTextFourth: {
    color: Tokens.colors.goldText,
  },
  levelBadge: {
    backgroundColor: Tokens.colors.surfaceMuted,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.sm,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
  },
  levelText: {
    color: Tokens.colors.textMuted,
    fontSize: Tokens.fontSize.xs,
    fontWeight: Tokens.fontWeight.semibold,
  },
  venueTitle: {
    color: Tokens.colors.text,
    fontSize: Tokens.fontSize.lg,
    fontWeight: Tokens.fontWeight.semibold,
  },
  courtSubtitle: {
    color: Tokens.colors.textMuted,
    fontSize: Tokens.fontSize.sm,
    marginTop: Tokens.spacing.xs,
    marginBottom: Tokens.spacing.md,
  },
  playersSection: {
    backgroundColor: Tokens.colors.surfaceMuted,
    borderRadius: Tokens.radii.sm,
    padding: Tokens.spacing.sm,
    marginBottom: Tokens.spacing.md,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
  },
  playersLabel: {
    color: Tokens.colors.textMuted,
    fontSize: Tokens.fontSize.xs,
    fontWeight: Tokens.fontWeight.medium,
    marginBottom: Tokens.spacing.xs,
  },
  playersList: {
    color: Tokens.colors.text,
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.medium,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Tokens.spacing.sm,
    borderTopWidth: Tokens.borders.width,
    borderTopColor: Tokens.colors.border,
  },
  costLabel: {
    color: Tokens.colors.textMuted,
    fontSize: Tokens.fontSize.xs,
    fontWeight: Tokens.fontWeight.medium,
  },
  costValue: {
    color: Tokens.colors.primaryText,
    fontSize: Tokens.fontSize.lg,
    fontWeight: Tokens.fontWeight.semibold,
    fontVariant: ['tabular-nums'],
    marginTop: Tokens.spacing.xs,
  },
  joinBtn: {
    backgroundColor: Tokens.colors.primary,
    minHeight: Tokens.dimensions.minTouchTarget,
    paddingHorizontal: Tokens.spacing.md,
    paddingVertical: Tokens.spacing.sm,
    borderRadius: Tokens.radii.button,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinBtnDisabled: {
    backgroundColor: Tokens.colors.surfaceMuted,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
  },
  joinBtnText: {
    color: Tokens.colors.primaryForeground,
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.semibold,
  },
  joinBtnTextDisabled: {
    color: Tokens.colors.textMuted,
  },
});
