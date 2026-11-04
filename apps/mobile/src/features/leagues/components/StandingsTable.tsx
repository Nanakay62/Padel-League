import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
import { Card } from '@/components/ui';
import type {
  BoxStandingItem,
  LeagueBoxItem,
} from '../hooks/useLeagueStandings';
import { DivisionPillSelector } from './DivisionPillSelector';
import { StandingsRow } from './StandingsRow';

export interface StandingsTableProps {
  boxes: LeagueBoxItem[];
  selectedBoxIndex: number;
  currentBox?: LeagueBoxItem;
  onSelectBox: (idx: number, boxId: string) => void;
  onChallengePair?: (pair: BoxStandingItem) => void;
  onViewFixtures?: (boxId: string) => void;
}

export function StandingsTable({
  boxes,
  selectedBoxIndex,
  currentBox,
  onSelectBox,
  onChallengePair,
  onViewFixtures,
}: StandingsTableProps) {
  if (!currentBox) return null;

  return (
    <Card style={styles.tableCard}>
      <View style={styles.tableCardHeader}>
        <View>
          <Text style={styles.cardHeaderTitle}>Official Accra Ladder</Text>
          <Text style={styles.cardHeaderSubtitle}>
            Dynamic ladder updated live after verified match submission
          </Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.liveBadgeText}>Live Rankings</Text>
        </View>
      </View>

      {/* Box / Ladder Tabs */}
      <DivisionPillSelector
        boxes={boxes}
        selectedBoxIndex={selectedBoxIndex}
        onSelectBox={onSelectBox}
      />

      {/* Standings Table */}
      <View style={styles.tableWrapper}>
        {/* Table Column Headers */}
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.headerCell, styles.rankCol]}>Rung</Text>
          <Text style={[styles.headerCell, styles.pairCol]}>Player / Team</Text>
          <Text style={[styles.headerCell, styles.ratingCol]}>Rating</Text>
          <Text style={[styles.headerCell, styles.recordCol]}>W - L</Text>
          <Text style={[styles.headerCell, styles.formCol]}>Form</Text>
          <Text style={[styles.headerCell, styles.actionCol]}>Status</Text>
        </View>

        {/* Standings Rows */}
        <FlatList
          data={currentBox.standings}
          keyExtractor={(item) => item.pair_id}
          scrollEnabled={false}
          renderItem={({ item, index }) => (
            <StandingsRow
              item={item}
              index={index}
              currentBoxId={currentBox.id}
              onChallengePair={onChallengePair}
              onViewFixtures={onViewFixtures}
            />
          )}
        />

        {/* Table Footer */}
        <View style={styles.tableFooter}>
          <Text style={styles.tableFooterText}>
            Showing {currentBox.standings.length} of 32 registered teams
          </Text>
          {onViewFixtures && (
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => onViewFixtures(currentBox.id)}
            >
              <Text style={styles.viewAllText}>View Complete Ladder</Text>
              <ArrowRight size={14} color={Tokens.colors.greenText} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  tableCard: {
    padding: Tokens.spacing.base,
    gap: Tokens.spacing.base,
  },
  tableCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Tokens.spacing.sm,
  },
  cardHeaderTitle: {
    ...Typography.headlineSm,
    color: Tokens.colors.text,
  },
  cardHeaderSubtitle: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: 4,
    borderRadius: Tokens.radii.chip,
    backgroundColor: Tokens.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Tokens.colors.primary,
  },
  liveBadgeText: {
    ...Typography.labelSm,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  tableWrapper: {
    gap: Tokens.spacing.xs,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Tokens.spacing.xs,
    paddingHorizontal: Tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.colors.border,
  },
  headerCell: {
    ...Typography.labelSm,
    color: Tokens.colors.textMuted,
    textTransform: 'uppercase',
  },
  rankCol: {
    width: 38,
    alignItems: 'center',
  },
  pairCol: {
    flex: 2,
    paddingHorizontal: Tokens.spacing.xs,
  },
  ratingCol: {
    width: 60,
    alignItems: 'center',
  },
  recordCol: {
    width: 55,
    alignItems: 'center',
  },
  formCol: {
    width: 65,
    alignItems: 'center',
  },
  actionCol: {
    width: 78,
    alignItems: 'flex-end',
  },
  tableFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Tokens.colors.border,
    marginTop: Tokens.spacing.xs,
    flexWrap: 'wrap',
    gap: Tokens.spacing.sm,
  },
  tableFooterText: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    ...Typography.labelSm,
    color: Tokens.colors.greenText,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
});
