import React from 'react';
import { StyleSheet, Text, View, Pressable, StyleProp, ViewStyle } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
import { PlayerAvatar } from './PlayerAvatar';

export interface CourtPlayer {
  id: string;
  initials: string;
  name: string;
  rating?: string | number;
  isCurrentUser?: boolean;
}

export interface CourtSeatDiagramProps {
  players: (CourtPlayer | null)[];
  courtLabel?: string;
  onOpenSpotPress?: (spotIndex: number) => void;
  style?: StyleProp<ViewStyle>;
}

export function CourtSeatDiagram({
  players,
  courtLabel,
  onOpenSpotPress,
  style,
}: CourtSeatDiagramProps) {
  // Ensure exactly 4 slots (2x2)
  const seats: (CourtPlayer | null)[] = [
    players[0] ?? null,
    players[1] ?? null,
    players[2] ?? null,
    players[3] ?? null,
  ];

  const renderSeat = (player: CourtPlayer | null, index: number) => {
    if (!player) {
      return (
        <Pressable
          key={`open-spot-${index}`}
          accessibilityRole="button"
          accessibilityLabel="Open spot. Join game."
          onPress={() => onOpenSpotPress?.(index)}
          style={({ pressed }) => [styles.seatContainer, pressed && styles.seatPressed]}
        >
          <View style={styles.openSpotCircle}>
            <Plus size={20} color={Tokens.colors.chalk} strokeWidth={2} />
          </View>
          <Text style={styles.openSpotTitle}>Open spot</Text>
          <Text style={styles.openSpotSubtitle}>Join game</Text>
        </Pressable>
      );
    }

    return (
      <View key={player.id || `player-${index}`} style={styles.seatContainer}>
        <PlayerAvatar
          initials={player.initials}
          size={56}
          isCurrentUser={player.isCurrentUser}
        />
        <Text style={styles.playerName} numberOfLines={1}>
          {player.name}
        </Text>
        {player.rating !== undefined && (
          <View style={styles.ratingChip}>
            <Text style={styles.ratingText}>{player.rating}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.wrapper, style]}>
      {courtLabel ? (
        <Text style={styles.courtEyebrow}>{courtLabel}</Text>
      ) : null}
      <View style={styles.courtContainer}>
        {/* Top half - 2 players */}
        <View style={styles.row}>
          {renderSeat(seats[0], 0)}
          {renderSeat(seats[1], 1)}
        </View>

        {/* Center Net Line */}
        <View style={styles.netLine} />

        {/* Bottom half - 2 players */}
        <View style={styles.row}>
          {renderSeat(seats[2], 2)}
          {renderSeat(seats[3], 3)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  courtEyebrow: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    fontWeight: Tokens.fontWeight.semibold,
    letterSpacing: 1.0,
    color: Tokens.colors.onInkMuted,
    textTransform: 'uppercase',
    marginBottom: Tokens.spacing.sm,
  },
  courtContainer: {
    backgroundColor: Tokens.colors.court,
    borderRadius: Tokens.radii.card,
    borderWidth: 2,
    borderColor: 'rgba(243, 240, 232, 0.4)',
    paddingVertical: Tokens.spacing.lg,
    paddingHorizontal: Tokens.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  netLine: {
    height: 1.5,
    width: '92%',
    backgroundColor: 'rgba(243, 240, 232, 0.45)',
    marginVertical: Tokens.spacing.md,
  },
  seatContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Tokens.spacing.xs,
  },
  seatPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  playerName: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    fontWeight: Tokens.fontWeight.medium,
    color: Tokens.colors.onInk,
    marginTop: Tokens.spacing.xs,
    textAlign: 'center',
  },
  ratingChip: {
    backgroundColor: Tokens.colors.lime,
    borderRadius: Tokens.radii.pill,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: 2,
    marginTop: 3,
  },
  ratingText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Tokens.fontSize.xs,
    fontWeight: Tokens.fontWeight.bold,
    color: Tokens.colors.ink,
  },
  openSpotCircle: {
    width: 54,
    height: 54,
    borderRadius: Tokens.radii.pill,
    borderWidth: 2,
    borderColor: 'rgba(243, 240, 232, 0.65)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openSpotTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.onInk,
    marginTop: Tokens.spacing.xs,
    textAlign: 'center',
  },
  openSpotSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.onInkMuted,
    marginTop: 2,
    textAlign: 'center',
  },
});
