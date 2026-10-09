import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Clock, Radio } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
import { formatGhanaCedis, formatAccraDateTime } from '@/lib/formatting';
import { useEvents } from '@/hooks/useData';
import {
  Screen,
  PageHeader,
  Card,
  Button,
  StatusPill,
  Stat,
} from '@/components/ui';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [isJoined, setIsJoined] = useState(false);
  const { data: events } = useEvents();

  const foundEvent = events.find((e) => e.id === id);

  const event = {
    id: id || 'evt-001',
    title: foundEvent?.title || 'Thursday Americano',
    venue_name: foundEvent?.venue_name || 'Accra Padel Club',
    address: 'Airport Residential Area, Accra',
    ghanapost_gps: 'GA-492-8012',
    format: foundEvent?.format || 'AMERICANO',
    courts: foundEvent?.courts || 2,
    point_target: foundEvent?.point_target || 24,
    planned_rounds: 8,
    price_pesewas: foundEvent?.pricing.total_price_pesewas || 8500,
    start_time: foundEvent?.start_time ? formatAccraDateTime(foundEvent.start_time) : 'Thu, Oct 8 • 6:00 PM',
    confirmed_players: [
      'Nana Kwame (3.8)',
      'Daniel Kojo (3.5)',
      'Ama Boateng (3.4)',
      'Kofi Mensah (3.2)',
      'Esi Appiah (3.0)',
      'Kojo Ansah (3.4)',
      'Yaw Boateng (3.8)',
      'Fiifi Sam (3.6)',
    ],
    max_players: foundEvent?.max_players || 12,
  };

  const isFull = event.confirmed_players.length >= event.max_players;

  return (
    <Screen>
      <PageHeader
        title={event.title}
        subtitle={event.venue_name}
        showBack
      />

      <View style={styles.container}>
        {/* Event Hero Card */}
        <Card style={styles.heroCard}>
          <View style={styles.formatRow}>
            <StatusPill label={event.format} variant="neutral" />
            <Text style={[styles.priceHighlight, Typography.tabularNums]}>
              {formatGhanaCedis(event.price_pesewas)}
            </Text>
          </View>

          <Text style={styles.eventTitle}>{event.title}</Text>

          <View style={styles.metaRow}>
            <MapPin size={14} color={Tokens.colors.textMuted} strokeWidth={1.75} />
            <Text style={styles.metaText}>{event.venue_name} ({event.ghanapost_gps})</Text>
          </View>

          <View style={styles.metaRow}>
            <Clock size={14} color={Tokens.colors.textMuted} strokeWidth={1.75} />
            <Text style={styles.metaText}>{event.start_time}</Text>
          </View>

          <View style={styles.statsRow}>
            <Stat label="Courts" value={event.courts} />
            <Stat label="Target" value={`${event.point_target} pts`} />
            <Stat
              label="Spots Left"
              value={Math.max(0, event.max_players - event.confirmed_players.length)}
            />
          </View>
        </Card>

        {/* Confirmed Roster */}
        <Card style={styles.rosterCard}>
          <View style={styles.rosterHeader}>
            <Text style={styles.sectionTitle}>Confirmed Roster</Text>
            <StatusPill
              label={`${event.confirmed_players.length} / ${event.max_players}`}
              variant="neutral"
            />
          </View>

          {event.confirmed_players.map((p, idx) => (
            <View key={idx} style={styles.playerRow}>
              <Text style={[styles.playerNum, Typography.tabularNums]}>#{idx + 1}</Text>
              <Text style={styles.playerName}>{p}</Text>
              <StatusPill label="Confirmed" variant="success" />
            </View>
          ))}
        </Card>

        {/* Live Courtside Action */}
        <Button
          title="Courtside Live Screen"
          variant="secondary"
          size="lg"
          onPress={() => router.push(`/events/${event.id}/live` as any)}
          icon={<Radio size={18} color={Tokens.colors.text} strokeWidth={1.75} />}
        />

        {/* Join Session CTA */}
        <Card style={styles.joinCard}>
          <View style={styles.joinInfoRow}>
            <View>
              <Text style={styles.feeLabel}>Total Entry Fee</Text>
              <Text style={[styles.feeValue, Typography.tabularNums]}>
                {formatGhanaCedis(event.price_pesewas)}
              </Text>
            </View>

            <Button
              title={
                isJoined
                  ? 'Confirmed'
                  : isFull
                    ? 'Join Waitlist'
                    : 'Confirm & Pay'
              }
              variant={isJoined ? 'secondary' : 'primary'}
              size="md"
              onPress={() => setIsJoined(!isJoined)}
            />
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Tokens.spacing.base,
    paddingBottom: Tokens.spacing.xxxl,
  },
  heroCard: {
    gap: Tokens.spacing.sm,
  },
  formatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceHighlight: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    color: Tokens.colors.greenText,
  },
  eventTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.lg,
    lineHeight: Tokens.lineHeight.lg,
    color: Tokens.colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  metaText: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Tokens.colors.border,
    marginTop: Tokens.spacing.xs,
  },
  rosterCard: {
    gap: Tokens.spacing.sm,
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Tokens.spacing.xs,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    color: Tokens.colors.text,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Tokens.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.colors.border,
    gap: Tokens.spacing.sm,
    minHeight: Tokens.touch.minTarget,
  },
  playerNum: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
    width: 24,
  },
  playerName: {
    flex: 1,
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
  },
  joinCard: {
    padding: Tokens.spacing.base,
  },
  joinInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  feeValue: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.lg,
    lineHeight: Tokens.lineHeight.lg,
    color: Tokens.colors.text,
  },
});
