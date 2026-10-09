import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Tokens } from '@/constants/theme';

interface WaitlistCardProps {
  position: number;
  eventTitle: string;
}

export function WaitlistCard({ position, eventTitle }: WaitlistCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.badgeContainer}>
        <Text style={styles.badgeText}>WAITLIST #{position}</Text>
      </View>
      <Text style={styles.title}>{eventTitle}</Text>
      <Text style={styles.description}>
        This event is currently full. If a confirmed player cancels or an unpaid hold expires,
        you will receive an exclusive 10-minute window to claim this seat.
      </Text>
      <View style={styles.statusBox}>
        <Text style={styles.statusText}>
          Position in line: <Text style={styles.statusBold}>{position}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Tokens.colors.surface,
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.md,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
    marginBottom: Tokens.spacing.md,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: Tokens.colors.goldLight,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.goldBorder,
    borderRadius: Tokens.radii.sm,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
    marginBottom: Tokens.spacing.sm,
  },
  badgeText: {
    color: Tokens.colors.goldText,
    fontSize: Tokens.fontSize.xs,
    fontWeight: Tokens.fontWeight.semibold,
    letterSpacing: 0.5,
  },
  title: {
    color: Tokens.colors.text,
    fontSize: Tokens.fontSize.lg,
    fontWeight: Tokens.fontWeight.semibold,
    marginBottom: Tokens.spacing.xs,
  },
  description: {
    color: Tokens.colors.textMuted,
    fontSize: Tokens.fontSize.sm,
    lineHeight: 20,
    marginBottom: Tokens.spacing.md,
  },
  statusBox: {
    backgroundColor: Tokens.colors.surfaceMuted,
    borderRadius: Tokens.radii.sm,
    padding: Tokens.spacing.sm,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
  },
  statusText: {
    color: Tokens.colors.textMuted,
    fontSize: Tokens.fontSize.sm,
  },
  statusBold: {
    color: Tokens.colors.primaryText,
    fontWeight: Tokens.fontWeight.semibold,
    fontVariant: ['tabular-nums'],
  },
});
