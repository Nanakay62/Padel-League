import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Clock, Radio, Shield, UserPlus } from 'lucide-react-native';
import { Tokens, Typography, useResponsiveLayout } from '@/constants/theme';
import { formatGhanaCedis, formatAccraDateTime } from '@/lib/formatting';
import { useEvents } from '@/hooks/useData';
import {
  Screen,
  PageHeader,
  Card,
  Button,
  StatusPill,
} from '@/components/ui';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDesktop, margin, gutter, maxContentWidth } = useResponsiveLayout();
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
    duration: '1h 45m',
    price_pesewas: foundEvent?.pricing.total_price_pesewas || 8500,
    court_share_pesewas: foundEvent?.pricing.court_share_pesewas || 8000,
    platform_fee_pesewas: foundEvent?.pricing.platform_fee_pesewas || 500,
    start_time: foundEvent?.start_time ? formatAccraDateTime(foundEvent.start_time) : 'Thu, Oct 8 • 6:00 PM',
    confirmed_players: [
      { name: 'Nana K.', rating: '3.80', isSelf: true },
      { name: 'Daniel K.', rating: '3.50', isSelf: false },
      { name: 'Ama B.', rating: '3.40', isSelf: false },
      { name: 'Kofi M.', rating: '3.20', isSelf: false },
      { name: 'Esi A.', rating: '3.00', isSelf: false },
      { name: 'Kojo A.', rating: '3.40', isSelf: false },
      { name: 'Yaw B.', rating: '3.80', isSelf: false },
      { name: 'Fiifi S.', rating: '3.60', isSelf: false },
    ],
    max_players: foundEvent?.max_players || 12,
  };

  const isFull = event.confirmed_players.length >= event.max_players;
  const openSlotsCount = Math.max(0, event.max_players - event.confirmed_players.length);

  return (
    <Screen>
      <PageHeader
        title={event.title}
        subtitle={event.venue_name}
        showBack
      />

      <View
        style={[
          styles.container,
          {
            paddingHorizontal: margin,
            maxWidth: maxContentWidth,
            gap: gutter,
          },
        ]}
      >
        {/* Event Hero Card */}
        <Card style={styles.heroCard}>
          <View style={styles.formatRow}>
            <View style={styles.statusGroup}>
              <StatusPill label={event.format} variant="neutral" />
              <View style={styles.openRegPill}>
                <View style={styles.liveIndicatorDot} />
                <Text style={styles.openRegText}>Registration Open</Text>
              </View>
            </View>
            <Text style={[styles.priceHighlight, Typography.tabularNums]}>
              {formatGhanaCedis(event.price_pesewas)}
            </Text>
          </View>

          <Text style={styles.eventTitle}>{event.title}</Text>

          <View style={styles.metaRow}>
            <MapPin size={14} color={Tokens.colors.textMuted} strokeWidth={1.75} />
            <Text style={styles.metaText}>
              {event.venue_name} ({event.ghanapost_gps})
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Clock size={14} color={Tokens.colors.textMuted} strokeWidth={1.75} />
            <Text style={[styles.metaText, Typography.tabularNums]}>
              {event.start_time}
            </Text>
          </View>

          {/* Match Format Stats Grid */}
          <View style={styles.formatGrid}>
            <View style={styles.formatStatTile}>
              <Text style={styles.formatStatLabel}>Target</Text>
              <Text style={[styles.formatStatValue, Typography.tabularNums]}>
                {event.point_target} pts
              </Text>
            </View>
            <View style={styles.formatStatTile}>
              <Text style={styles.formatStatLabel}>Rounds</Text>
              <Text style={[styles.formatStatValue, Typography.tabularNums]}>
                {event.planned_rounds}
              </Text>
            </View>
            <View style={styles.formatStatTile}>
              <Text style={styles.formatStatLabel}>Courts</Text>
              <Text style={[styles.formatStatValue, Typography.tabularNums]}>
                {event.courts}
              </Text>
            </View>
            <View style={styles.formatStatTile}>
              <Text style={styles.formatStatLabel}>Spots Left</Text>
              <Text style={[styles.formatStatValue, Typography.tabularNums]}>
                {openSlotsCount}
              </Text>
            </View>
          </View>
        </Card>

        {/* Confirmed Roster Card */}
        <Card style={styles.rosterCard}>
          <View style={styles.rosterHeader}>
            <View style={styles.rosterTitleGroup}>
              <Text style={styles.sectionTitle}>Confirmed Roster</Text>
              <StatusPill
                label={`${event.confirmed_players.length} / ${event.max_players}`}
                variant="neutral"
              />
            </View>
            {openSlotsCount > 0 && (
              <Text style={styles.openSpotsHighlight}>
                {openSlotsCount} open spots
              </Text>
            )}
          </View>

          <View style={isDesktop ? styles.playersGridDesktop : styles.playersGridMobile}>
            {event.confirmed_players.map((p, idx) => (
              <View key={idx} style={styles.playerRow}>
                <View style={styles.playerLeft}>
                  <View style={styles.playerAvatar}>
                    <Text style={styles.avatarText}>
                      {p.name.charAt(0)}
                    </Text>
                  </View>
                  <Text style={styles.playerName}>
                    {p.name}
                  </Text>
                  {p.isSelf && (
                    <Text style={styles.selfBadge}>(You)</Text>
                  )}
                </View>

                <View style={styles.playerRight}>
                  <Text style={[styles.playerRating, Typography.tabularNums]}>
                    {p.rating}
                  </Text>
                  <StatusPill label="Confirmed" variant="success" />
                </View>
              </View>
            ))}

            {/* Display Available Slots */}
            {openSlotsCount > 0 && (
              <View style={styles.openSlotRow}>
                <View style={styles.openSlotLeft}>
                  <UserPlus size={16} color={Tokens.colors.textMuted} strokeWidth={1.75} />
                  <Text style={styles.openSlotText}>Available Open Slot</Text>
                </View>
                <StatusPill label="Available" variant="neutral" />
              </View>
            )}
          </View>
        </Card>

        {/* Payment Breakdown Card */}
        <Card style={styles.paymentCard}>
          <Text style={styles.sectionTitle}>Payment Breakdown</Text>
          <View style={styles.paymentRows}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Court share</Text>
              <Text style={[styles.paymentValue, Typography.tabularNums]}>
                {formatGhanaCedis(event.court_share_pesewas)}
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Platform fee</Text>
              <Text style={[styles.paymentValue, Typography.tabularNums]}>
                {formatGhanaCedis(event.platform_fee_pesewas)}
              </Text>
            </View>
            <View style={styles.paymentDivider} />
            <View style={styles.paymentRow}>
              <Text style={styles.paymentTotalLabel}>Total</Text>
              <Text style={[styles.paymentTotalValue, Typography.tabularNums]}>
                {formatGhanaCedis(event.price_pesewas)}
              </Text>
            </View>
          </View>

          <View style={styles.secureBadgeRow}>
            <Shield size={14} color={Tokens.colors.greenText} strokeWidth={1.75} />
            <Text style={styles.secureBadgeText}>
              Supported via MTN MoMo, Telecel Cash & Cards
            </Text>
          </View>
        </Card>

        {/* Live Courtside Action Button */}
        <Button
          title="Courtside Live Screen"
          variant="secondary"
          size="lg"
          onPress={() => router.push(`/events/${event.id}/live` as any)}
          icon={<Radio size={18} color={Tokens.colors.text} strokeWidth={1.75} />}
        />

        {/* Join Session CTA Card */}
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
    paddingBottom: Tokens.spacing.xxxl,
    width: '100%',
    alignSelf: 'center',
  },
  heroCard: {
    gap: Tokens.spacing.sm,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  formatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  openRegPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    backgroundColor: Tokens.colors.primaryLight,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.chip,
  },
  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: Tokens.radii.pill,
    backgroundColor: Tokens.colors.primary,
  },
  openRegText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.greenText,
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
    fontSize: Tokens.fontSize.xl,
    lineHeight: Tokens.lineHeight.xl,
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
  formatGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Tokens.colors.border,
    marginTop: Tokens.spacing.xs,
    gap: Tokens.spacing.xs,
  },
  formatStatTile: {
    flex: 1,
    backgroundColor: Tokens.colors.background,
    paddingVertical: Tokens.spacing.sm,
    paddingHorizontal: Tokens.spacing.xs,
    borderRadius: Tokens.radii.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  formatStatLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  formatStatValue: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
    marginTop: 2,
  },
  rosterCard: {
    gap: Tokens.spacing.sm,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Tokens.spacing.xs,
  },
  rosterTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    color: Tokens.colors.text,
  },
  openSpotsHighlight: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.greenText,
  },
  playersGridMobile: {
    flexDirection: 'column',
  },
  playersGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.sm,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Tokens.spacing.xs,
    paddingHorizontal: Tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.colors.border,
    minHeight: Tokens.touch.minTarget,
    borderRadius: Tokens.radii.card,
  },
  playerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    flex: 1,
  },
  playerAvatar: {
    width: 28,
    height: 28,
    borderRadius: Tokens.radii.pill,
    backgroundColor: Tokens.colors.background,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.text,
  },
  playerName: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
  },
  selfBadge: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.greenText,
  },
  playerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
  playerRating: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  openSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Tokens.spacing.sm,
    paddingHorizontal: Tokens.spacing.sm,
    backgroundColor: Tokens.colors.background,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    marginTop: Tokens.spacing.xs,
  },
  openSlotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  openSlotText: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textMuted,
  },
  paymentCard: {
    gap: Tokens.spacing.sm,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  paymentRows: {
    gap: Tokens.spacing.xs,
    paddingTop: Tokens.spacing.xs,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textMuted,
  },
  paymentValue: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.text,
  },
  paymentDivider: {
    height: 1,
    backgroundColor: Tokens.colors.border,
    marginVertical: Tokens.spacing.xs,
  },
  paymentTotalLabel: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    color: Tokens.colors.text,
  },
  paymentTotalValue: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.lg,
    lineHeight: Tokens.lineHeight.lg,
    color: Tokens.colors.text,
  },
  secureBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    paddingTop: Tokens.spacing.xs,
  },
  secureBadgeText: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  joinCard: {
    padding: Tokens.spacing.base,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
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
