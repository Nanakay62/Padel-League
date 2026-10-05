import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PadelBrand, Colors } from '@/constants/theme';

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
    backgroundColor: PadelBrand.cardDark,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
    marginBottom: 16,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(244, 196, 48, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  badgeText: {
    color: PadelBrand.gold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  statusBox: {
    backgroundColor: PadelBrand.charcoal,
    borderRadius: 8,
    padding: 12,
  },
  statusText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
  },
  statusBold: {
    color: PadelBrand.electricGreen,
    fontWeight: '700',
  },
});
