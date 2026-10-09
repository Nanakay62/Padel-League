import React, { useState } from 'react';
import {
  FlatList,
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
  PageHeader,
  Card,
  Button,
  Chip,
  StatusPill,
} from '@/components/ui';

export default function FindEventsScreen() {
  const router = useRouter();
  const { isDesktop, margin, gutter, maxContentWidth } = useResponsiveLayout();
  const { data: events } = useEvents();
  const [selectedFormat, setSelectedFormat] = useState('ALL');
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
      <PageHeader
        title="Find Events"
        subtitle="Discover and join matches"
        rightAction={
          <Button
            title="+ Host Event"
            variant="primary"
            size="sm"
            onPress={() => router.push('/events/create')}
            testID="find-events-host-btn"
          />
        }
      />

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
        {/* Top Circuit Banner */}
        <Card style={styles.circuitBannerCard}>
          <View style={styles.bannerHeaderRow}>
            <View style={styles.liveCircuitBadge}>
              <View style={styles.livePulseDot} />
              <Text style={styles.liveCircuitText}>Live Circuit</Text>
            </View>
            <Text style={styles.circuitSubtitle}>Accra Metro Series • Season 02</Text>
          </View>

          <Text style={[styles.bannerTitle, isDesktop && styles.bannerTitleDesktop]}>
            Find Events
          </Text>
          <Text style={styles.bannerDescription}>
            Discover and join Americano, Mexicano, and social match sessions across Accra. Filter by player rating band and secured court slots.
          </Text>

          <View style={styles.bannerStatsRow}>
            <View style={styles.bannerStatItem}>
              <Zap size={14} color={Tokens.colors.greenText} strokeWidth={1.75} />
              <Text style={styles.bannerStatText}>
                {events.length} active sessions
              </Text>
            </View>
            <Text style={styles.bannerStatDot}>•</Text>
            <View style={styles.bannerStatItem}>
              <Shield size={14} color={Tokens.colors.textMuted} strokeWidth={1.75} />
              <Text style={styles.bannerStatText}>
                Official GPR synced
              </Text>
            </View>
          </View>
        </Card>

        {/* Search & Filter Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchBarContainer}>
            <Search size={18} color={Tokens.colors.textMuted} strokeWidth={1.75} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by title or venue..."
              placeholderTextColor={Tokens.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Format Filter Chips */}
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

          {/* Showing Counter */}
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
                  <StatusPill label={item.format} variant="neutral" />
                  <StatusPill
                    label={item.status === 'FULL' ? t('statusFull') : t('statusOpen')}
                    variant={item.status === 'FULL' ? 'danger' : 'success'}
                  />
                </View>

                <Text style={styles.eventTitle}>{item.title}</Text>

                <View style={styles.metaRow}>
                  <MapPin size={14} color={Tokens.colors.textMuted} strokeWidth={1.75} />
                  <Text style={styles.metaText}>{item.venue_name}</Text>
                </View>

                {/* Specifics Box */}
                <View style={styles.specificsBox}>
                  <View style={styles.specificRow}>
                    <View style={styles.specificLabelRow}>
                      <Clock size={12} color={Tokens.colors.textMuted} strokeWidth={1.75} />
                      <Text style={styles.specificLabel}>Date & Time</Text>
                    </View>
                    <Text style={[styles.specificValue, Typography.tabularNums]}>
                      {formatAccraDateTime(item.start_time)}
                    </Text>
                  </View>

                  <View style={styles.specificRow}>
                    <Text style={styles.specificLabel}>Level Band</Text>
                    <Text style={[styles.specificValue, Typography.tabularNums]}>
                      {item.level_min.toFixed(1)} - {item.level_max.toFixed(1)}
                    </Text>
                  </View>

                  <View style={styles.specificRow}>
                    <Text style={styles.specificLabel}>Capacity</Text>
                    <View style={styles.capacityProgressRow}>
                      <View style={styles.capacityBar}>
                        <View
                          style={[
                            styles.capacityBarFill,
                            { width: `${Math.round(capacityRatio * 100)}%` as any },
                          ]}
                        />
                      </View>
                      <Text style={[styles.capacityText, Typography.tabularNums]}>
                        {confirmedCount} / {item.max_players}
                      </Text>
                    </View>
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
  content: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  circuitBannerCard: {
    backgroundColor: Tokens.colors.card,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    padding: Tokens.spacing.lg,
    gap: Tokens.spacing.xs,
  },
  bannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
    marginBottom: Tokens.spacing.xs,
  },
  liveCircuitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    backgroundColor: Tokens.colors.primaryLight,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: Tokens.radii.chip,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: Tokens.radii.pill,
    backgroundColor: Tokens.colors.primary,
  },
  liveCircuitText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.greenText,
  },
  circuitSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  bannerTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xl,
    lineHeight: Tokens.lineHeight.xl,
    color: Tokens.colors.text,
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
    color: Tokens.colors.textMuted,
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
    color: Tokens.colors.textMuted,
  },
  bannerStatDot: {
    color: Tokens.colors.textMuted,
    fontSize: Tokens.fontSize.xs,
  },
  searchSection: {
    gap: Tokens.spacing.sm,
  },
  searchBarContainer: {
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
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  specificsBox: {
    backgroundColor: Tokens.colors.background,
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.sm,
    gap: Tokens.spacing.xs,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  specificRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specificLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  specificLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  specificValue: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.text,
  },
  capacityProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
  capacityBar: {
    width: 60,
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
  },
  capacityText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.text,
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
