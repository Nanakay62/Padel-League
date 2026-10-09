import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Clock } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
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

      <View style={styles.content}>
        {/* Search Input */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title or venue..."
          placeholderTextColor={Tokens.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

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

        {/* Event List */}
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Card
              style={styles.eventCard}
              onPress={() => router.push(`/events/${item.id}` as any)}
            >
              <View style={styles.cardHeader}>
                <StatusPill label={item.format} variant="neutral" />
                <Text style={[styles.priceTag, Typography.tabularNums]}>
                  {formatGhanaCedis(item.pricing.total_price_pesewas)}
                </Text>
              </View>

              <Text style={styles.eventTitle}>{item.title}</Text>

              <View style={styles.metaRow}>
                <MapPin size={14} color={Tokens.colors.textMuted} strokeWidth={1.75} />
                <Text style={styles.metaText}>{item.venue_name}</Text>
              </View>

              <View style={styles.metaRow}>
                <Clock size={14} color={Tokens.colors.textMuted} strokeWidth={1.75} />
                <Text style={styles.metaText}>{formatAccraDateTime(item.start_time)}</Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.rosterText}>
                  {item.confirmed_count} / {item.max_players} Players
                </Text>
                <StatusPill
                  label={item.status === 'FULL' ? t('statusFull') : t('statusOpen')}
                  variant={item.status === 'FULL' ? 'danger' : 'success'}
                />
              </View>
            </Card>
          )}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  searchInput: {
    backgroundColor: Tokens.colors.card,
    borderRadius: Tokens.radii.input,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    paddingHorizontal: Tokens.spacing.base,
    paddingVertical: Tokens.spacing.md,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    marginBottom: Tokens.spacing.md,
    minHeight: Tokens.touch.minTarget,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Tokens.spacing.sm,
    marginBottom: Tokens.spacing.base,
  },
  listContent: {
    paddingBottom: Tokens.spacing.xxxl,
    gap: Tokens.spacing.md,
  },
  eventCard: {
    gap: Tokens.spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceTag: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    color: Tokens.colors.greenText,
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Tokens.spacing.xs,
    paddingTop: Tokens.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Tokens.colors.border,
  },
  rosterText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
});
