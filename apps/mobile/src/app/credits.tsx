import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Tokens, Typography, useResponsiveLayout } from '@/constants/theme';
import { formatGhanaCedis } from '@/lib/formatting';
import { Screen, PageHeader, Card, Stat } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';

interface CreditRecord {
  id: string;
  amount_pesewas: number;
  reason: string;
  created_at: string;
}

export default function CreditsScreen() {
  const { isDesktop } = useResponsiveLayout();
  const { isAuthenticated } = useAuth();
  const [balancePesewas, setBalancePesewas] = useState(0);
  const [credits, setCredits] = useState<CreditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;

    apiFetch('/me/credits')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch credits');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setBalancePesewas(data.balance_pesewas ?? 0);
          setCredits(data.credits ?? []);
        }
      })
      .catch(() => {
        // Fallback gracefully on network error
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  return (
    <Screen>
      <PageHeader
        title="Credits"
        subtitle="Platform credits and balance"
        showBack={!isDesktop}
      />

      <Card style={styles.card}>
        <Stat
          label="Current Balance"
          value={formatGhanaCedis(balancePesewas)}
        />
        {isLoading ? (
          <ActivityIndicator color={Tokens.colors.primary} size="small" />
        ) : (
          <Text style={styles.description}>
            Non-withdrawable platform credits issued for event cancellations and refunds.
            Automatically applied towards your next event registration.
          </Text>
        )}

        {credits.length > 0 && (
          <View style={styles.historyBox}>
            <Text style={styles.historyTitle}>Recent Activity</Text>
            {credits.slice(0, 5).map((cr) => (
              <View key={cr.id} style={styles.historyRow}>
                <Text style={styles.historyReason} numberOfLines={1}>
                  {cr.reason}
                </Text>
                <Text
                  style={[
                    styles.historyAmount,
                    cr.amount_pesewas >= 0
                      ? { color: Tokens.colors.greenText }
                      : { color: Tokens.colors.textMuted },
                  ]}
                >
                  {cr.amount_pesewas >= 0 ? '+' : ''}
                  {formatGhanaCedis(cr.amount_pesewas)}
                </Text>
              </View>
            ))}
          </View>
        )}
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
  historyBox: {
    marginTop: Tokens.spacing.md,
    borderTopWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
    paddingTop: Tokens.spacing.md,
    gap: Tokens.spacing.sm,
  },
  historyTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.sm,
    color: Tokens.colors.text,
    marginBottom: Tokens.spacing.xs,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Tokens.spacing.xs,
  },
  historyReason: {
    flex: 1,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.textMuted,
    marginRight: Tokens.spacing.sm,
  },
  historyAmount: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    fontVariant: ['tabular-nums'],
  },
});

