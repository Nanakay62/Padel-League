import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MapPin, Calendar } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
import { Card } from '@/components/ui';

export interface VenueFilterBarProps {
  todayDateString: string;
  locationLabel?: string;
  surfaceLabel?: string;
}

export function VenueFilterBar({
  todayDateString,
  locationLabel = 'All Accra Hubs',
  surfaceLabel = 'Panoramic Glass',
}: VenueFilterBarProps) {
  return (
    <Card style={styles.filterStrip}>
      <View style={styles.filterChipsRow}>
        <View style={styles.filterPill}>
          <MapPin size={14} color={Tokens.colors.textMuted} />
          <Text style={styles.filterPillLabel}>Location:</Text>
          <Text style={styles.filterPillValue}>{locationLabel}</Text>
        </View>
        <View style={styles.filterPill}>
          <Calendar size={14} color={Tokens.colors.textMuted} />
          <Text style={styles.filterPillValue}>Today, {todayDateString}</Text>
        </View>
        <View style={styles.filterPill}>
          <Text style={styles.filterPillLabel}>Surface:</Text>
          <Text style={styles.filterPillValue}>{surfaceLabel}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  filterStrip: {
    padding: Tokens.spacing.sm,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.sm,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.sm,
    backgroundColor: Tokens.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  filterPillLabel: {
    ...Typography.labelSm,
    color: Tokens.colors.textMuted,
  },
  filterPillValue: {
    ...Typography.labelSm,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
});
