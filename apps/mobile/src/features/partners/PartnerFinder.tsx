import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MapPin, Send } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
import { Card, Button, Chip, StatusPill } from '@/components/ui';

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
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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
          <Chip
            key={f.id}
            label={f.label}
            selected={sideFilter === f.id}
            onPress={() => setSideFilter(f.id as typeof sideFilter)}
          />
        ))}
      </View>

      {/* Player Cards */}
      {filtered.map((player) => (
        <Card key={player.id} style={styles.playerCard}>
          <View style={styles.playerHeader}>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{player.displayName}</Text>
              <View style={styles.venueRow}>
                <MapPin size={14} color={Tokens.colors.textMuted} strokeWidth={1.75} />
                <Text style={styles.venueText}>
                  {player.homeVenueName || 'Accra Padel Club'}
                </Text>
              </View>
            </View>

            <View style={styles.levelBadge}>
              <Text style={[styles.levelNum, Typography.tabularNums]}>
                {player.level.toFixed(1)}
              </Text>
              <Text style={styles.levelSub}>LEVEL</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <StatusPill
              label={`Side: ${player.preferredSide === 'EITHER' ? 'Left or Right' : player.preferredSide}`}
              variant="neutral"
            />
            <StatusPill label={player.levelBand} variant="neutral" />
          </View>

          <Button
            title="Invite to Match"
            variant="primary"
            size="md"
            onPress={() => onInvite(player.id)}
            icon={<Send size={16} color={Tokens.colors.textOnPrimary} strokeWidth={1.75} />}
          />
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Tokens.spacing.xxxl,
    gap: Tokens.spacing.base,
  },
  title: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xl,
    lineHeight: Tokens.lineHeight.xl,
    color: Tokens.colors.text,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textMuted,
    marginTop: -Tokens.spacing.sm,
    marginBottom: Tokens.spacing.xs,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Tokens.spacing.sm,
    marginBottom: Tokens.spacing.xs,
  },
  playerCard: {
    gap: Tokens.spacing.md,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerInfo: {
    flex: 1,
    gap: Tokens.spacing.xs,
  },
  playerName: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.lg,
    lineHeight: Tokens.lineHeight.lg,
    color: Tokens.colors.text,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  venueText: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  levelBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Tokens.colors.background,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    paddingHorizontal: Tokens.spacing.md,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.card,
  },
  levelNum: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    color: Tokens.colors.text,
  },
  levelSub: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
});
