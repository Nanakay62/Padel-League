import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Tokens, Typography } from '@/constants/theme';
import { formatGhanaCedis } from '@/lib/formatting';
import { Screen, PageHeader, Card, Stat } from '@/components/ui';

export default function CreditsScreen() {
  const balancePesewas = 5000; // GH₵ 50.00

  return (
    <Screen>
      <PageHeader
        title="Credits"
        subtitle="Platform credits and balance"
        showBack
      />

      <Card style={styles.card}>
        <Stat
          label="Current Balance"
          value={formatGhanaCedis(balancePesewas)}
        />
        <Text style={styles.description}>
          Credit balance and cancellation credits arrive with payments (Phase 5)
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Tokens.spacing.base,
    padding: Tokens.spacing.xl,
  },
  description: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textMuted,
  },
});
