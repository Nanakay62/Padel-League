import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PadelBrand } from '@/constants/theme';
import { formatGhanaCedis } from '@/lib/formatting';

export default function HomeScreen() {
  const router = useRouter();

  const userBalancePesewas = 5000; // GH₵ 50.00
  const userRating = 3.42;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appTitle}>Padel Ghana</Text>
            <Text style={styles.welcomeSubtitle}>Akwaaba, Kwadwo 🎾</Text>
          </View>
          <Pressable
            style={styles.balanceBadge}
            onPress={() => router.push('/credits')}
            accessibilityRole="button"
            accessibilityLabel="Credit Balance"
            testID="home-credit-balance-btn"
          >
            <Text style={styles.balanceLabel}>Credit Balance</Text>
            <Text style={styles.balanceValue}>
              {formatGhanaCedis(userBalancePesewas)}
            </Text>
          </Pressable>
        </View>

        {/* Next Session Hero Card */}
        <View style={styles.nextSessionCard}>
          <View style={styles.nextSessionHeader}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>NEXT SESSION</Text>
            </View>
            <Text style={styles.timeTag}>Today • 18:00 UTC</Text>
          </View>

          <Text style={styles.sessionTitle}>
            Friday Night Accra Americano (24 Pts)
          </Text>
          <Text style={styles.venueInfo}>
            📍 Accra City Padel Club • Court 2 & 3
          </Text>
          <Text style={styles.gpsAddress}>Digital Address: GA-492-8012</Text>

          <View style={styles.sessionFooter}>
            <View style={styles.confirmedAvatars}>
              <Text style={styles.playersText}>8 / 8 Confirmed (Full)</Text>
            </View>
            <Pressable
              style={styles.actionBtn}
              onPress={() => router.push('/events/evt-001/live')}
              testID="home-courtside-live-btn"
            >
              <Text style={styles.actionBtnText}>Courtside Live →</Text>
            </Pressable>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionTitle}>Explore & Play</Text>
        <View style={styles.grid}>
          {/* Find Events */}
          <Pressable
            style={styles.gridCard}
            onPress={() => router.push('/events')}
            testID="home-find-events-btn"
          >
            <Text style={styles.gridIcon}>🎾</Text>
            <Text style={styles.gridCardTitle}>Find Events</Text>
            <Text style={styles.gridCardDesc}>Americano & Mexicano</Text>
          </Pressable>

          {/* Box Leagues */}
          <Pressable
            style={styles.gridCard}
            onPress={() => router.push('/leagues')}
            testID="home-box-leagues-btn"
          >
            <Text style={styles.gridIcon}>🏆</Text>
            <Text style={styles.gridCardTitle}>Box Leagues</Text>
            <Text style={styles.gridCardDesc}>Standings & fixtures</Text>
          </Pressable>

          {/* Open Matches */}
          <Pressable
            style={styles.gridCard}
            onPress={() => router.push('/partners')}
            testID="home-partner-finder-btn"
          >
            <Text style={styles.gridIcon}>👥</Text>
            <Text style={styles.gridCardTitle}>Partner Finder</Text>
            <Text style={styles.gridCardDesc}>Find a 4th for match</Text>
          </Pressable>

          {/* My Rating */}
          <Pressable
            style={styles.gridCard}
            onPress={() => router.push('/ratings')}
            testID="home-my-rating-btn"
          >
            <Text style={styles.gridIcon}>📈</Text>
            <Text style={styles.gridCardTitle}>My Rating</Text>
            <Text style={styles.gridCardDesc}>
              {userRating.toFixed(2)} (Intermediate)
            </Text>
          </Pressable>

          {/* Venues Directory */}
          <Pressable
            style={styles.gridCard}
            onPress={() => router.push('/venues')}
            testID="home-venues-btn"
          >
            <Text style={styles.gridIcon}>📍</Text>
            <Text style={styles.gridCardTitle}>Venues</Text>
            <Text style={styles.gridCardDesc}>Courts in Accra</Text>
          </Pressable>

          {/* Settings / Data-Light */}
          <Pressable
            style={styles.gridCard}
            onPress={() => router.push('/settings')}
            testID="home-settings-btn"
          >
            <Text style={styles.gridIcon}>⚙️</Text>
            <Text style={styles.gridCardTitle}>Settings</Text>
            <Text style={styles.gridCardDesc}>Data-light & offline</Text>
          </Pressable>
        </View>

        {/* Organiser Card */}
        <View style={styles.organiserBanner}>
          <View style={styles.organiserBannerContent}>
            <Text style={styles.organiserTitle}>Host or Run a Club Event?</Text>
            <Text style={styles.organiserSub}>
              Set up automated rotations, GHS MoMo collections, and WhatsApp summaries.
            </Text>
          </View>
          <Pressable
            style={styles.createBtn}
            onPress={() => router.push('/events/create')}
            testID="home-create-event-btn"
          >
            <Text style={styles.createBtnText}>Create Event</Text>
          </Pressable>
        </View>
      </ScrollView>
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
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: PadelBrand.electricGreen,
    fontWeight: '600',
    marginTop: 2,
  },
  balanceBadge: {
    backgroundColor: PadelBrand.cardDark,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '800',
    color: PadelBrand.electricGreen,
    marginTop: 2,
  },
  nextSessionCard: {
    backgroundColor: PadelBrand.cardDark,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
    marginBottom: 20,
  },
  nextSessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PadelBrand.electricGreen,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: PadelBrand.electricGreen,
    letterSpacing: 0.5,
  },
  timeTag: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  sessionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  venueInfo: {
    fontSize: 13,
    color: '#CBD5E1',
    marginBottom: 2,
  },
  gpsAddress: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 12,
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#25302C',
    paddingTop: 10,
  },
  confirmedAvatars: {
    flex: 1,
  },
  playersText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  actionBtn: {
    backgroundColor: PadelBrand.electricGreen,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0B0F0E',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  gridCard: {
    width: '48%',
    backgroundColor: PadelBrand.cardDark,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
  gridIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  gridCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  gridCardDesc: {
    fontSize: 11,
    color: '#94A3B8',
  },
  organiserBanner: {
    backgroundColor: 'rgba(22, 28, 26, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#25302C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  organiserBannerContent: {
    flex: 1,
  },
  organiserTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  organiserSub: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 15,
  },
  createBtn: {
    backgroundColor: '#25302C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PadelBrand.electricGreen,
  },
  createBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: PadelBrand.electricGreen,
  },
});
