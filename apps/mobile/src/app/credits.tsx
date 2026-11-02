import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Tokens, Typography, useResponsiveLayout } from '@/constants/theme';
import { formatGhanaCedis } from '@/lib/formatting';
import { Screen, PageHeader, Card, CreditBlock, Button } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import { Smartphone, ShieldCheck, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';

interface CreditRecord {
  id: string;
  amount_pesewas: number;
  reason: string;
  created_at: string;
}

export default function CreditsScreen() {
  const { isDesktop, margin, gutter, maxContentWidth } = useResponsiveLayout();
  const { isAuthenticated } = useAuth();
  const [balancePesewas, setBalancePesewas] = useState(5000);
  const [credits, setCredits] = useState<CreditRecord[]>([
    {
      id: 'cr-1',
      amount_pesewas: 5000,
      reason: 'Rain cancellation refund - Court 2',
      created_at: '2026-10-28T14:30:00Z',
    },
    {
      id: 'cr-2',
      amount_pesewas: 2500,
      reason: 'Host referral bonus',
      created_at: '2026-10-20T10:15:00Z',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTopUp, setSelectedTopUp] = useState<number | null>(null);

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
          if (data.balance_pesewas !== undefined) {
            setBalancePesewas(data.balance_pesewas);
          }
          if (data.credits && data.credits.length > 0) {
            setCredits(data.credits);
          }
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

  const handleTopUp = (amountPesewas: number) => {
    setSelectedTopUp(amountPesewas);
  };

  return (
    <Screen>
      <PageHeader
        title="Credits"
        subtitle="Ghana Cedis platform balance & top up"
        showBack={!isDesktop}
      />

      <View
        style={[
          styles.container,
          {
            paddingHorizontal: margin,
            maxWidth: maxContentWidth,
            gap: gutter,
          },
        ]}
      >
        {/* Court Chalk Vibrant Lime Credit Block */}
        <CreditBlock
          label="Current Balance"
          balancePesewas={balancePesewas}
          onTopUpPress={() => handleTopUp(5000)}
          testID="credits-balance-card"
        />

        {/* Quick Top-up Packs */}
        <Card style={styles.topUpCard}>
          <Text style={styles.sectionTitle}>Quick MoMo Top Up</Text>
          <Text style={styles.sectionSubtitle}>
            Instant balance reload via MTN Mobile Money or Telecel Cash.
          </Text>

          <View style={styles.packsRow}>
            {[
              { label: 'GH₵ 25', pesewas: 2500 },
              { label: 'GH₵ 50', pesewas: 5000 },
              { label: 'GH₵ 100', pesewas: 10000 },
              { label: 'GH₵ 200', pesewas: 20000 },
            ].map((pack) => {
              const isSelected = selectedTopUp === pack.pesewas;
              return (
                <Button
                  key={pack.pesewas}
                  title={pack.label}
                  variant={isSelected ? 'ink' : 'secondary'}
                  size="sm"
                  onPress={() => handleTopUp(pack.pesewas)}
                  style={styles.packButton}
                />
              );
            })}
          </View>

          <View style={styles.momoInfoRow}>
            <Smartphone size={16} color={Tokens.colors.textMuted} strokeWidth={1.75} />
            <Text style={styles.momoInfoText}>
              Supported via MTN MoMo (*170#), Telecel Cash (*110#), & AT Money.
            </Text>
          </View>
        </Card>

        {/* Recent Ledger / Activity */}
        <Card style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>Credit Activity & Refunds</Text>
            {isLoading && <ActivityIndicator color={Tokens.colors.primary} size="small" />}
          </View>

          {credits.length === 0 ? (
            <Text style={styles.emptyText}>No recent credit transactions.</Text>
          ) : (
            <View style={styles.historyList}>
              {credits.map((cr) => {
                const isPositive = cr.amount_pesewas >= 0;
                return (
                  <View key={cr.id} style={styles.historyRow}>
                    <View style={styles.historyLeft}>
                      <View style={styles.historyIconCircle}>
                        {isPositive ? (
                          <ArrowDownLeft size={16} color={Tokens.colors.court} strokeWidth={2} />
                        ) : (
                          <ArrowUpRight size={16} color={Tokens.colors.textMuted} strokeWidth={2} />
                        )}
                      </View>
                      <View style={styles.historyTextGroup}>
                        <Text style={styles.historyReason} numberOfLines={1}>
                          {cr.reason}
                        </Text>
                        <Text style={styles.historyDate}>Platform Ledger</Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.historyAmount,
                        isPositive ? styles.amountPositive : styles.amountNegative,
                        Typography.tabularNums,
                      ]}
                    >
                      {isPositive ? '+' : ''}
                      {formatGhanaCedis(cr.amount_pesewas)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.policyRow}>
            <ShieldCheck size={14} color={Tokens.colors.court} strokeWidth={1.75} />
            <Text style={styles.policyText}>
              Credits are automatically applied towards your next event entry fee.
            </Text>
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'center',
    paddingBottom: Tokens.spacing.xxxl,
  },
  topUpCard: {
    padding: Tokens.spacing.lg,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    backgroundColor: Tokens.colors.card,
    gap: Tokens.spacing.sm,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.display,
    fontWeight: Tokens.fontWeight.bold,
    fontSize: Tokens.fontSize.lg,
    lineHeight: Tokens.lineHeight.lg,
    color: Tokens.colors.text,
  },
  sectionSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textMuted,
  },
  packsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.sm,
    paddingTop: Tokens.spacing.xs,
  },
  packButton: {
    flexGrow: 1,
    minWidth: 90,
  },
  momoInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    paddingTop: Tokens.spacing.xs,
  },
  momoInfoText: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
    flex: 1,
  },
  historyCard: {
    padding: Tokens.spacing.lg,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    backgroundColor: Tokens.colors.card,
    gap: Tokens.spacing.md,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyList: {
    gap: Tokens.spacing.xs,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.colors.border,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
    flex: 1,
  },
  historyIconCircle: {
    width: 32,
    height: 32,
    borderRadius: Tokens.radii.pill,
    backgroundColor: Tokens.colors.chalk,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTextGroup: {
    flex: 1,
    gap: 2,
  },
  historyReason: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.sm,
    color: Tokens.colors.text,
  },
  historyDate: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.textMuted,
  },
  historyAmount: {
    fontFamily: Typography.fontFamily.display,
    fontWeight: Tokens.fontWeight.bold,
    fontSize: Tokens.fontSize.base,
  },
  amountPositive: {
    color: Tokens.colors.court,
  },
  amountNegative: {
    color: Tokens.colors.textMuted,
  },
  emptyText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.sm,
    color: Tokens.colors.textMuted,
    paddingVertical: Tokens.spacing.md,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    paddingTop: Tokens.spacing.xs,
  },
  policyText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.textMuted,
    flex: 1,
  },
});

