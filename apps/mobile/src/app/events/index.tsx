import React, { useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Clock, Search, Shield, Zap } from 'lucide-react-native';
import { Tokens, Typography, useResponsiveLayout } from '@/constants/theme';
import { formatGhanaCedis, formatAccraDateTime } from '@/lib/formatting';
import { useEvents } from '@/hooks/useData';
import { t } from '@/lib/i18n';
import {
  Screen,
  Card,
  Button,
  Chip,
  StatusPill,
  CircuitBanner,
  HorizontalDayPicker,
  PlayerSlotRoster,
} from '@/components/ui';

export default function FindEventsScreen() {
  const router = useRouter();
  const { margin, gutter, maxContentWidth } = useResponsiveLayout();
  const { data: events } = useEvents();
  const [selectedFormat, setSelectedFormat] = useState('ALL');
  const [selectedDay, setSelectedDay] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = events.filter((evt) => {
    const matchesFormat =
      selectedFormat === 'ALL' || evt.format === selectedFormat;
    const matchesQuery =
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.venue_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFormat && matchesQuery;
  });

  return (
    <Screen scrollable={false}>
      <View
        style={[
          styles.content,
          {
            paddingHorizontal: margin,
            maxWidth: maxContentWidth,
            gap: gutter,
          },
        ]}
      >
        {/* Top Search Bar & Host Action */}
        <View style={styles.topBar}>
          <View style={styles.searchBarContainer}>
            <Search size={18} color={Tokens.colors.textMuted} strokeWidth={1.75} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by title, format or club..."
              placeholderTextColor={Tokens.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <Button
            title="+ Host Event"
            variant="primary"
            size="md"
            onPress={() => router.push('/events/create')}
            testID="find-events-host-btn"
          />
        </View>

        {/* Blue Hero Banner Card */}
        <CircuitBanner
          badge="ACCRA AMERICANO & SOCIAL EVENTS"
          title="Find Events"
          description="Discover and join Americano, Mexicano, and social match sessions across Accra. Filter by player rating band and secured court slots."
          testID="events-banner-card"
          stats={[
            {
              icon: <Zap size={14} color={Tokens.colors.gold} strokeWidth={1.75} />,
              label: `${events.length} active sessions`,
            },
            {
              icon: <Shield size={14} color={Tokens.colors.bannerBlueIcon} strokeWidth={1.75} />,
              label: 'Official GPR synced',
            },
          ]}
        />

        {/* Playtomic Horizontal Day Picker */}
        <HorizontalDayPicker
          selectedDayId={selectedDay}
          onSelectDay={setSelectedDay}
        />

        {/* Filter Chips & Counter Section */}
        <View style={styles.filterSection}>
          <View style={styles.filterRow}>
            {['ALL', 'AMERICANO', 'MEXICANO', 'TEAM_AMERICANO'].map((fmt) => (
              <Chip
                key={fmt}
                label={fmt === 'TEAM_AMERICANO' ? 'TEAM' : fmt}
                selected={selectedFormat === fmt}
                onPress={() => setSelectedFormat(fmt)}
              />
            ))}
          </View>

          <View style={styles.counterRow}>
            <Text style={styles.counterText}>
              Showing{' '}
              <Text style={[styles.counterNumber, Typography.tabularNums]}>
                {filteredEvents.length}
              </Text>{' '}
              sessions
            </Text>
            <Text style={styles.momoNote}>MTN MoMo & Card accepted</Text>
          </View>
        </View>

        {/* Event List / Grid */}
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const confirmedCount = item.confirmed_count ?? 8;
            const capacityRatio = Math.min(1, confirmedCount / item.max_players);

            return (
              <Card
                style={styles.eventCard}
                onPress={() => router.push(`/events/${item.id}` as any)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.headerBadgesRow}>
                    <StatusPill label={item.format} variant="primary" />
                    <StatusPill
                      label={`Level ${item.level_min.toFixed(1)} - ${item.level_max.toFixed(1)}`}
                      variant="neutral"
                    />
                  </View>
                  <StatusPill
                    label={item.status === 'FULL' ? t('statusFull') : `${item.max_players - confirmedCount} spots left`}
                    variant={item.status === 'FULL' ? 'danger' : 'success'}
                  />
                </View>

                <Text style={styles.eventTitle}>{item.title}</Text>

                <View style={styles.metaRow}>
                  <MapPin size={14} color={Tokens.colors.textMuted} strokeWidth={1.75} />
                  <Text style={styles.metaText}>{item.venue_name} • Padel Court</Text>
                </View>

                <View style={styles.timeRow}>
                  <Clock size={13} color={Tokens.colors.textMuted} strokeWidth={1.75} />
                  <Text style={[styles.timeText, Typography.tabularNums]}>
                    {formatAccraDateTime(item.start_time)}
                  </Text>
                </View>

                {/* Playtomic Slot Roster Preview */}
                <View style={styles.rosterRow}>
                  <PlayerSlotRoster
                    mode="court"
                    filledSlots={[
                      { name: 'Player 1', level: `${item.level_min.toFixed(1)}` },
                      { name: 'Player 2', level: `${((item.level_min + item.level_max) / 2).toFixed(1)}` },
                      ...(confirmedCount > 2 ? [{ name: 'Player 3', level: `${item.level_max.toFixed(1)}` }] : []),
                    ]}
                    totalSlots={4}
                    emptySlotLabel={item.status === 'FULL' ? undefined : 'Join'}
                    onPressEmpty={() => router.push(`/events/${item.id}` as any)}
                  />
                </View>

                {/* Capacity Progress Section */}
                <View style={styles.capacitySection}>
                  <View style={styles.capacityLabelsRow}>
                    <Text style={styles.capacityLabel}>Players Registered</Text>
                    <Text style={[styles.capacityRatioText, Typography.tabularNums]}>
                      {confirmedCount} / {item.max_players}
                    </Text>
                  </View>
                  <View style={styles.capacityBar}>
                    <View
                      style={[
                        styles.capacityBarFill,
                        { width: `${Math.round(capacityRatio * 100)}%` as any },
                      ]}
                    />
                  </View>
                </View>

                {/* Card Footer */}
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.entryFeeLabel}>Entry Fee</Text>
                    <Text style={[styles.priceTag, Typography.tabularNums]}>
                      {formatGhanaCedis(item.pricing.total_price_pesewas)}
                    </Text>
                  </View>

                  <Button
                    title="View Session"
                    variant="primary"
                    size="sm"
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      router.push(`/events/${item.id}` as any);
                    }}
                  />
                </View>
              </Card>
            );
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    width: '100%',
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
  },
  content: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  circuitBannerCard: {
    backgroundColor: Tokens.colors.bannerBlueDark,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.bannerBlueBorder,
    padding: Tokens.spacing.lg,
    gap: Tokens.spacing.xs,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      },
      default: {
        elevation: 2,
        shadowColor: Tokens.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  bannerTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xl,
    lineHeight: Tokens.lineHeight.xl,
    color: Tokens.colors.bannerBlueText,
  },
  bannerTitleDesktop: {
    fontSize: Tokens.fontSize.xxl,
    lineHeight: Tokens.lineHeight.xxl,
  },
  bannerDescription: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.bannerBlueTextMuted,
  },
  bannerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
    paddingTop: Tokens.spacing.xs,
  },
  bannerStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  bannerStatText: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.bannerBlueText,
  },
  bannerStatDot: {
    color: Tokens.colors.bannerBlueTag,
    fontSize: Tokens.fontSize.xs,
  },
  filterSection: {
    gap: Tokens.spacing.sm,
  },
  searchBarContainer: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Tokens.colors.card,
    borderRadius: Tokens.radii.input,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    paddingHorizontal: Tokens.spacing.md,
    gap: Tokens.spacing.xs,
    minHeight: Tokens.touch.minTarget,
  },
  searchInput: {
    flex: 1,
    width: '100%',
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    paddingVertical: Tokens.spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.xs,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Tokens.spacing.xs,
  },
  counterText: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  counterNumber: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.text,
  },
  momoNote: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  listContent: {
    paddingBottom: Tokens.spacing.xxxl + 64,
    gap: Tokens.spacing.md,
  },
  eventCard: {
    gap: Tokens.spacing.sm,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    backgroundColor: Tokens.colors.card,
    padding: Tokens.spacing.base,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
      },
      default: {
        elevation: 2,
        shadowColor: Tokens.colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  eventTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
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
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  timeText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  rosterRow: {
    paddingVertical: Tokens.spacing.xs,
  },
  capacitySection: {
    backgroundColor: Tokens.colors.background,
    borderRadius: Tokens.radii.sm,
    padding: Tokens.spacing.sm,
    gap: Tokens.spacing.xs,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  capacityLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capacityLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.textMuted,
  },
  capacityRatioText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.text,
  },
  capacityBar: {
    width: '100%',
    height: 6,
    borderRadius: Tokens.radii.pill,
    backgroundColor: Tokens.colors.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    overflow: 'hidden',
  },
  capacityBarFill: {
    height: '100%',
    backgroundColor: Tokens.colors.primary,
    borderRadius: Tokens.radii.pill,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Tokens.spacing.xs,
    paddingTop: Tokens.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Tokens.colors.border,
  },
  entryFeeLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  priceTag: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    color: Tokens.colors.text,
  },
});
