import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Search } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { Screen, PageHeader, Card, StatusPill } from '@/components/ui';

export default function SearchScreen() {
  return (
    <Screen>
      <PageHeader
        title={t('placeholderSearchTitle')}
        subtitle="Global Search"
        showBack
      />

      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <StatusPill label="SEARCH" variant="neutral" />
          <Search size={20} color={Tokens.colors.textMuted} strokeWidth={1.75} />
        </View>

        <Text style={styles.title}>{t('placeholderSearchTitle')}</Text>
        <Text style={styles.description}>
          {t('placeholderSearchText')}
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Tokens.spacing.md,
    padding: Tokens.spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.lg,
    lineHeight: Tokens.lineHeight.lg,
    color: Tokens.colors.text,
  },
  description: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textMuted,
  },
});
