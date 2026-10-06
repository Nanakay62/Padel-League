import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PadelBrand } from '@/constants/theme';
import { formatGhanaCedis } from '@/lib/formatting';

interface EventItem {
  id: string;
  title: string;
  venue_name: string;
  format: string;
  courts: number;
  point_target: number;
  price_pesewas: number;
  confirmed_count: number;
  max_players: number;
  start_time: string;
  status: string;
}

const SAMPLE_EVENTS: EventItem[] = [
  {
    id: 'evt-001',
    title: 'Friday Sunset Americano',
    venue_name: 'Accra City Padel Club',
    format: 'AMERICANO',
    courts: 2,
    point_target: 24,
    price_pesewas: 6000,
    confirmed_count: 8,
    max_players: 8,
    start_time: 'Today • 18:00 UTC',
    status: 'FULL',
  },
  {
    id: 'evt-002',
    title: 'Saturday Morning Mexicano',
    venue_name: 'Trust Sports Emporium',
    format: 'MEXICANO',
    courts: 3,
    point_target: 32,
    price_pesewas: 7500,
    confirmed_count: 10,
    max_players: 12,
    start_time: 'Tomorrow • 08:30 UTC',
    status: 'OPEN',
  },
  {
    id: 'evt-003',
    title: 'Sunday Pairs Team Clash',
    venue_name: 'Burma Camp Padel Court',
    format: 'TEAM_AMERICANO',
    courts: 2,
    point_target: 24,
    price_pesewas: 5000,
    confirmed_count: 6,
    max_players: 8,
    start_time: 'Sunday • 16:00 UTC',
    status: 'OPEN',
  },
];

export default function FindEventsScreen() {
  const router = useRouter();
  const [selectedFormat, setSelectedFormat] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = SAMPLE_EVENTS.filter((evt) => {
    const matchesFormat =
      selectedFormat === 'ALL' || evt.format === selectedFormat;
    const matchesQuery =
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.venue_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFormat && matchesQuery;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Find Events</Text>
          <Pressable
            style={styles.createBtn}
            onPress={() => router.push('/events/create')}
          >
            <Text style={styles.createBtnText}>+ Host Event</Text>
          </Pressable>
        </View>

        {/* Search Input */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title or venue..."
          placeholderTextColor="#64748B"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Format Filter Chips */}
        <View style={styles.filterRow}>
          {['ALL', 'AMERICANO', 'MEXICANO', 'TEAM_AMERICANO'].map((fmt) => (
            <Pressable
              key={fmt}
              style={[
                styles.chip,
                selectedFormat === fmt && styles.chipActive,
              ]}
              onPress={() => setSelectedFormat(fmt)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedFormat === fmt && styles.chipTextActive,
                ]}
              >
                {fmt === 'TEAM_AMERICANO' ? 'TEAM' : fmt}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Event List */}
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={styles.eventCard}
              onPress={() => router.push(`/events/${item.id}`)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.formatBadge}>
                  <Text style={styles.formatText}>{item.format}</Text>
                </View>
                <Text style={styles.priceTag}>
                  {formatGhanaCedis(item.price_pesewas)}
                </Text>
              </View>

              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text style={styles.venueText}>📍 {item.venue_name}</Text>
              <Text style={styles.timeText}>🕒 {item.start_time}</Text>

              <View style={styles.cardFooter}>
                <Text style={styles.rosterText}>
                  {item.confirmed_count} / {item.max_players} Players
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    item.status === 'FULL'
                      ? styles.statusFull
                      : styles.statusOpen,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      item.status === 'FULL'
                        ? styles.statusTextFull
                        : styles.statusTextOpen,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PadelBrand.charcoal,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  createBtn: {
    backgroundColor: PadelBrand.electricGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  createBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0B0F0E',
  },
  searchInput: {
    backgroundColor: PadelBrand.cardDark,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: PadelBrand.cardDark,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
  chipActive: {
    backgroundColor: PadelBrand.electricGreen,
    borderColor: PadelBrand.electricGreen,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  chipTextActive: {
    color: '#0B0F0E',
  },
  listContent: {
    paddingBottom: 24,
    gap: 12,
  },
  eventCard: {
    backgroundColor: PadelBrand.cardDark,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  formatBadge: {
    backgroundColor: 'rgba(0, 200, 83, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  formatText: {
    fontSize: 10,
    fontWeight: '800',
    color: PadelBrand.electricGreen,
    letterSpacing: 0.5,
  },
  priceTag: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  venueText: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#CBD5E1',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#25302C',
    paddingTop: 10,
  },
  rosterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusOpen: {
    backgroundColor: 'rgba(0, 200, 83, 0.2)',
  },
  statusFull: {
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusTextOpen: {
    color: PadelBrand.electricGreen,
  },
  statusTextFull: {
    color: '#F43F5E',
  },
});
