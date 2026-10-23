import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';

export interface PlayerSlot {
  name: string;
  avatarUrl?: string;
  level?: string | number;
  isUser?: boolean;
}

export interface PlayerSlotRosterProps {
  slots?: PlayerSlot[];
  filledSlots?: PlayerSlot[];
  totalCapacity?: number;
  totalSlots?: number;
  mode?: 'court' | 'americano';
  emptySlotLabel?: string;
  onPressEmpty?: () => void;
  compact?: boolean;
  testID?: string;
}

export function PlayerSlotRoster({
  slots,
  filledSlots,
  totalCapacity,
  totalSlots,
  mode,
  emptySlotLabel = 'Open',
  onPressEmpty,
  compact = false,
  testID,
}: PlayerSlotRosterProps) {
  const activeSlots = filledSlots ?? slots ?? [];
  const capacity = totalSlots ?? totalCapacity ?? 4;
  const isCourtMode = mode === 'court' || (!mode && capacity <= 4);

  // If court mode, render Playtomic's 4-spot visualizer
  if (isCourtMode) {
    const spots = Array.from({ length: capacity }, (_, i) => activeSlots[i] || null);

    return (
      <View style={[styles.container, compact && styles.containerCompact]} testID={testID}>
        {spots.map((spot, idx) => {
          if (spot) {
            const initials = spot.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <View key={idx} style={styles.slotWrapper}>
                <View
                  style={[
                    styles.avatarCircle,
                    spot.isUser ? styles.userAvatarBorder : styles.filledAvatarBorder,
                  ]}
                >
                  {spot.avatarUrl ? (
                    <Image source={{ uri: spot.avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.initialsContainer}>
                      <Text style={styles.initialsText}>{initials}</Text>
                    </View>
                  )}

                  {spot.level !== undefined && (
                    <View style={styles.levelBadge}>
                      <Text style={[styles.levelBadgeText, Typography.tabularNums]}>
                        {typeof spot.level === 'number' ? spot.level.toFixed(1) : spot.level}
                      </Text>
                    </View>
                  )}
                </View>
                {!compact && (
                  <Text style={styles.slotNameText} numberOfLines={1}>
                    {spot.isUser ? 'You' : spot.name.split(' ')[0]}
                  </Text>
                )}
              </View>
            );
          }

          // Open Slot
          const SlotComponent = onPressEmpty ? TouchableOpacity : View;

          return (
            <SlotComponent
              key={idx}
              style={styles.slotWrapper}
              onPress={onPressEmpty}
              activeOpacity={0.7}
            >
              <View style={styles.emptySlotCircle}>
                <Plus size={16} color={Tokens.colors.slotEmptyIcon} strokeWidth={2} />
              </View>
              {!compact && <Text style={styles.emptySlotLabel}>{emptySlotLabel}</Text>}
            </SlotComponent>
          );
        })}
      </View>
    );
  }

  // Roster stack view for large events (e.g. Americano 8 to 12 players)
  const visibleSlots = activeSlots.slice(0, 4);
  const remainingCount = Math.max(0, capacity - activeSlots.length);

  return (
    <View style={styles.stackContainer} testID={testID}>
      <View style={styles.avatarOverlapRow}>
        {visibleSlots.map((spot, idx) => {
          const initials = spot.name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();

          return (
            <View
              key={idx}
              style={[
                styles.overlapAvatar,
                { zIndex: 10 - idx, marginLeft: idx === 0 ? 0 : -8 },
                spot.isUser ? styles.userAvatarBorder : styles.filledAvatarBorder,
              ]}
            >
              {spot.avatarUrl ? (
                <Image source={{ uri: spot.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.initialsContainer}>
                  <Text style={styles.initialsTextSmall}>{initials}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.quotaPill}>
        <Text style={[styles.quotaPillText, Typography.tabularNums]}>
          {activeSlots.length}/{capacity} players
        </Text>
        {remainingCount > 0 && (
          <Text style={styles.remainingSubtext}>({remainingCount} spots left)</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Tokens.spacing.sm,
    gap: Tokens.spacing.sm,
  },
  containerCompact: {
    paddingVertical: 2,
    gap: Tokens.spacing.xs,
  },
  slotWrapper: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: Tokens.radii.pill,
    position: 'relative',
    backgroundColor: Tokens.colors.slotFilledBg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: Tokens.radii.pill,
  },
  initialsContainer: {
    width: '100%',
    height: '100%',
    borderRadius: Tokens.radii.pill,
    backgroundColor: Tokens.colors.slotFilledBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.primary,
  },
  initialsTextSmall: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xxs,
    color: Tokens.colors.primary,
  },
  filledAvatarBorder: {
    borderWidth: 1.5,
    borderColor: Tokens.colors.slotFilledBorder,
  },
  userAvatarBorder: {
    borderWidth: 2,
    borderColor: Tokens.colors.primary,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: Tokens.colors.primary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: Tokens.radii.pill,
    borderWidth: 1,
    borderColor: Tokens.colors.surface,
  },
  levelBadgeText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.badge,
    lineHeight: Tokens.lineHeight.badge,
    color: Tokens.colors.textOnPrimary,
  },
  slotNameText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.text,
    textAlign: 'center',
  },
  emptySlotCircle: {
    width: 44,
    height: 44,
    borderRadius: Tokens.radii.pill,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Tokens.colors.slotEmptyBorder,
    backgroundColor: Tokens.colors.slotEmptyBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.textMuted,
    textAlign: 'center',
  },
  stackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.md,
    paddingVertical: Tokens.spacing.xs,
  },
  avatarOverlapRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overlapAvatar: {
    width: 32,
    height: 32,
    borderRadius: Tokens.radii.pill,
    position: 'relative',
    backgroundColor: Tokens.colors.slotFilledBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quotaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  quotaPillText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.sm,
    color: Tokens.colors.text,
  },
  remainingSubtext: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.greenText,
  },
});
