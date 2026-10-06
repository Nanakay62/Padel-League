import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PadelBrand } from '@/constants/theme';
import { formatGhanaCedis } from '@/lib/formatting';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [isJoined, setIsJoined] = useState(false);

  const event = {
    id: id || 'evt-001',
    title: 'Friday Sunset Americano (24 Pts)',
    venue_name: 'Accra City Padel Club',
    address: 'Ring Road Central, Accra',
    ghanapost_gps: 'GA-492-8012',
    format: 'AMERICANO',
    courts: 2,
    point_target: 24,
    planned_rounds: 8,
    price_pesewas: 6000,
    start_time: 'Friday, 18:00 UTC',
    confirmed_players: [
      'Kojo Ansah (3.4)',
      'Kwame Mensah (3.1)',
      'Yaw Boateng (3.8)',
      'Esi Appiah (2.9)',
      'Kofi Osei (3.5)',
      'Ama Darko (3.2)',
      'Fiifi Sam (3.6)',
    ],
    max_players: 8,
  };

  const isFull = event.confirmed_players.length >= event.max_players;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Navigation Back */}
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Back to Events</Text>
        </Pressable>

        {/* Event Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.formatTag}>
            <Text style={styles.formatText}>{event.format}</Text>
          </View>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.venueName}>📍 {event.venue_name}</Text>
          <Text style={styles.gpsAddress}>GPS: {event.ghanapost_gps}</Text>
          <Text style={styles.timeTag}>🕒 {event.start_time}</Text>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Courts</Text>
              <Text style={styles.metaValue}>{event.courts}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Target</Text>
              <Text style={styles.metaValue}>{event.point_target} pts</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Fee</Text>
              <Text style={styles.metaValueHighlight}>
                {formatGhanaCedis(event.price_pesewas)}
              </Text>
            </View>
          </View>
        </View>

        {/* Confirmed Roster */}
        <View style={styles.rosterCard}>
          <View style={styles.rosterHeader}>
            <Text style={styles.sectionTitle}>Confirmed Roster</Text>
            <Text style={styles.rosterCount}>
              {event.confirmed_players.length} / {event.max_players}
            </Text>
          </View>

          {event.confirmed_players.map((p, idx) => (
            <View key={idx} style={styles.playerRow}>
              <Text style={styles.playerNum}>#{idx + 1}</Text>
              <Text style={styles.playerName}>{p}</Text>
              <Text style={styles.confirmedCheck}>✓ Confirmed</Text>
            </View>
          ))}
        </View>

        {/* Live Event Shortcuts */}
        <Pressable
          style={styles.liveShortcut}
          onPress={() => router.push(`/events/${event.id}/live`)}
        >
          <Text style={styles.liveShortcutText}>
            View Courtside Live Screen →
          </Text>
        </Pressable>
      </ScrollView>

      {/* Floating Checkout Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>Entry Fee</Text>
          <Text style={styles.footerPrice}>
            {formatGhanaCedis(event.price_pesewas)}
          </Text>
        </View>
        <Pressable
          style={[
            styles.joinBtn,
            isJoined && styles.joinedBtn,
            isFull && !isJoined && styles.waitlistBtn,
          ]}
          onPress={() => setIsJoined(!isJoined)}
        >
          <Text style={styles.joinBtnText}>
            {isJoined
              ? '✓ You Are Confirmed'
              : isFull
                ? 'Join Waitlist (MoMo)'
                : 'Confirm & Pay (Paystack/MoMo)'}
          </Text>
        </Pressable>
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
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  backBtn: {
    marginBottom: 12,
  },
  backBtnText: {
    fontSize: 13,
    color: PadelBrand.electricGreen,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: PadelBrand.cardDark,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
    marginBottom: 16,
  },
  formatTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 200, 83, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  formatText: {
    fontSize: 11,
    fontWeight: '800',
    color: PadelBrand.electricGreen,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  venueName: {
    fontSize: 14,
    color: '#CBD5E1',
    marginBottom: 2,
  },
  gpsAddress: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 6,
  },
  timeTag: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 14,
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0B0F0E',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#25302C',
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  metaValueHighlight: {
    fontSize: 14,
    fontWeight: '800',
    color: PadelBrand.electricGreen,
  },
  rosterCard: {
    backgroundColor: PadelBrand.cardDark,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
    marginBottom: 16,
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rosterCount: {
    fontSize: 13,
    fontWeight: '700',
    color: PadelBrand.electricGreen,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2320',
  },
  playerNum: {
    width: 24,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  playerName: {
    flex: 1,
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  confirmedCheck: {
    fontSize: 11,
    color: PadelBrand.electricGreen,
    fontWeight: '700',
  },
  liveShortcut: {
    backgroundColor: '#1E2925',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PadelBrand.electricGreen,
  },
  liveShortcutText: {
    fontSize: 13,
    fontWeight: '700',
    color: PadelBrand.electricGreen,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: PadelBrand.cardDark,
    borderTopWidth: 1,
    borderTopColor: PadelBrand.borderDark,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  footerPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  joinBtn: {
    backgroundColor: PadelBrand.electricGreen,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  joinedBtn: {
    backgroundColor: '#25302C',
  },
  waitlistBtn: {
    backgroundColor: '#F59E0B',
  },
  joinBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0B0F0E',
  },
});
