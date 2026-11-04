import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Tokens } from '@/constants/theme';
import { Chip } from '@/components/ui';
import type { LeagueBoxItem } from '../hooks/useLeagueStandings';

export interface DivisionPillSelectorProps {
  boxes: LeagueBoxItem[];
  selectedBoxIndex: number;
  onSelectBox: (index: number, boxId: string) => void;
}

export function DivisionPillSelector({
  boxes,
  selectedBoxIndex,
  onSelectBox,
}: DivisionPillSelectorProps) {
  if (boxes.length <= 1) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.tabsContainer}
      contentContainerStyle={styles.tabsContent}
    >
      {boxes.map((b, idx) => (
        <Chip
          key={b.id}
          label={`Box ${b.box_number}: ${b.name}`}
          selected={selectedBoxIndex === idx}
          onPress={() => onSelectBox(idx, b.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    marginHorizontal: -Tokens.spacing.base,
    paddingHorizontal: Tokens.spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.colors.border,
  },
  tabsContent: {
    gap: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.sm,
  },
});
