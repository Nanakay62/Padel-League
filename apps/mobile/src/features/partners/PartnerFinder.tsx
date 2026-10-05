import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PadelBrand } from '@/constants/theme';

export interface PartnerItem {
  id: string;
  displayName: string;
  level: number;
  levelBand: string;
  preferredSide: 'LEFT' | 'RIGHT' | 'EITHER';
  homeVenueName?: string;
}

interface PartnerFinderProps {
  partners: PartnerItem[];
  onInvite: (partnerId: string) => void;
}

export function PartnerFinder({ partners, onInvite }: PartnerFinderProps) {
  const [sideFilter, setSideFilter] = useState<'ALL' | 'LEFT' | 'RIGHT'>('ALL');

  const filtered = partners.filter((p) => {
    if (sideFilter === 'ALL') return true;
    return p.preferredSide === sideFilter || p.preferredSide === 'EITHER';
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Find a Partner</Text>
        <Text style={styles.subtitle}>
          Connect with players in Ghana at your skill level looking for games.
        </Text>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {[
            { id: 'ALL', label: 'All Sides' },
            { id: 'LEFT', label: 'Left Side' },
            { id: 'RIGHT', label: 'Right Side' },
          ].map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.filterChip,
                sideFilter === f.id && styles.filterChipActive,
              ]}
              onPress={() => setSideFilter(f.id as typeof sideFilter)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  sideFilter === f.id && styles.filterChipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Player Cards */}
        {filtered.map((player) => (
          <View key={player.id} style={styles.playerCard}>
            <View style={styles.playerHeader}>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.displayName}</Text>
                <Text style={styles.venueText}>
                  📍 {player.homeVenueName || 'Accra Padel Club'}
                </Text>
              </View>

              <View style={styles.levelBadge}>
                <Text style={styles.levelNum}>{player.level}</Text>
                <Text style={styles.levelSub}>LEVEL</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.sideBadge}>
                <Text style={styles.sideText}>
                  Side: {player.preferredSide === 'EITHER' ? 'Left or Right' : player.preferredSide}
                </Text>
              </View>
              <Text style={styles.bandText}>{player.levelBand}</Text>
            </View>

            <TouchableOpacity
              style={styles.inviteBtn}
              onPress={() => onInvite(player.id)}
            >
              <Text style={styles.inviteBtnText}>Invite to Match 🎾</Text>
            </TouchableOpacity>
          </View>
        ))}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No players found for this filter.</Text>
          </View>
        )}
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
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 20,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#1E2623',
    borderWidth: 1,
    borderColor: '#293630',
  },
  filterChipActive: {
    backgroundColor: PadelBrand.electricGreen,
    borderColor: PadelBrand.electricGreen,
  },
  filterChipText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#0B0F0E',
    fontWeight: '700',
  },
  playerCard: {
    backgroundColor: PadelBrand.cardDark,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  venueText: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  levelBadge: {
    backgroundColor: '#1B2721',
    borderWidth: 1,
    borderColor: PadelBrand.electricGreen,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  levelNum: {
    color: PadelBrand.electricGreen,
    fontSize: 18,
    fontWeight: '800',
  },
  levelSub: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
    marginTop: -2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sideBadge: {
    backgroundColor: '#202825',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sideText: {
    color: PadelBrand.gold,
    fontSize: 12,
    fontWeight: '600',
  },
  bandText: {
    color: '#64748B',
    fontSize: 12,
  },
  inviteBtn: {
    backgroundColor: PadelBrand.electricGreen,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteBtnText: {
    color: '#0B0F0E',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 15,
  },
});
