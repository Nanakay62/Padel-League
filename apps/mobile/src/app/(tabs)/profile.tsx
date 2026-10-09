import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  Shield,
  CreditCard,
  Settings,
  ChevronRight,
  Trophy,
  Activity,
  Award,
} from 'lucide-react-native';
import { Tokens, Typography, useResponsiveLayout } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Screen, PageHeader, Card, StatusPill, Button } from '@/components/ui';

export default function ProfileTabScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { isDesktop, isTablet } = useResponsiveLayout();

  const playerName = user?.name || 'Kwame Antwi-Boasiako';
  const playerPhone = user?.phone_e164 || '+233 24 412 3456';
  const playerRating = user?.level ? user.level.toFixed(2) : '3.42';

  return (
    <Screen>
      <PageHeader
        title={t('placeholderProfileTitle')}
        subtitle="Player Account & Circuit Profile"
      />

      <View style={[styles.container, (isDesktop || isTablet) && styles.containerWide]}>
        {/* Main Profile Info Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeaderRow}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarInitials}>
                {playerName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </Text>
            </View>

            <View style={styles.profileDetailsCol}>
              <View style={styles.nameRow}>
                <Text style={styles.playerNameText}>{playerName}</Text>
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              </View>
              <Text style={styles.playerPhoneText}>{playerPhone}</Text>
              <View style={styles.statusPillsRow}>
                <StatusPill
                  label={isAuthenticated ? 'SIGNED IN' : 'GUEST'}
                  variant={isAuthenticated ? 'success' : 'neutral'}
                />
                {user?.is_provisional && (
                  <StatusPill label={t('ratingProvisionalTag')} variant="neutral" />
                )}
              </View>
            </View>
          </View>

          {/* Quick Metrics Strip */}
          <View style={styles.metricsStrip}>
            <TouchableOpacity
              style={styles.metricItem}
              onPress={() => router.push('/ratings')}
            >
              <Text style={styles.metricLabel}>PG Rating</Text>
              <Text style={[styles.metricValue, Typography.tabularNums]}>
                Level {playerRating}
              </Text>
              <Text style={styles.metricSub}>View History</Text>
            </TouchableOpacity>

            <View style={[styles.metricItem, styles.metricBorder]}>
              <Text style={styles.metricLabel}>Matches</Text>
              <Text style={[styles.metricValue, Typography.tabularNums]}>24 Played</Text>
              <Text style={styles.metricSub}>16 Wins (67%)</Text>
            </View>

            <TouchableOpacity
              style={[styles.metricItem, styles.metricBorder]}
              onPress={() => router.push('/leagues')}
            >
              <Text style={styles.metricLabel}>Accra Ladder</Text>
              <Text style={[styles.metricValue, Typography.tabularNums]}>Rung 4</Text>
              <Text style={styles.metricSub}>Premier Box</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* MoMo Balance & Billing Card */}
        <Card style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <View style={styles.walletTitleRow}>
              <View style={styles.walletIconBox}>
                <CreditCard size={18} color={Tokens.colors.text} />
              </View>
              <View>
                <Text style={styles.walletTitle}>Padel Ghana MoMo Wallet</Text>
                <Text style={styles.walletSubtitle}>
                  Instant match fee & court split payments
                </Text>
              </View>
            </View>
            <Button
              title="Top Up"
              variant="secondary"
              size="sm"
              onPress={() => router.push('/credits')}
            />
          </View>

          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={[styles.balanceValue, Typography.tabularNums]}>
                GH₵ 340.00
              </Text>
            </View>
            <View style={styles.verifiedMomoBadge}>
              <Shield size={14} color={Tokens.colors.greenText} />
              <Text style={styles.verifiedMomoText}>MTN MoMo Active</Text>
            </View>
          </View>
        </Card>

        {/* Quick Links Menu */}
        <Card style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/ratings')}
          >
            <View style={styles.menuRowLeft}>
              <Award size={18} color={Tokens.colors.text} />
              <Text style={styles.menuRowLabel}>Player Rating & Level Breakdown</Text>
            </View>
            <ChevronRight size={16} color={Tokens.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuRow, styles.menuRowBorder]}
            onPress={() => router.push('/leagues')}
          >
            <View style={styles.menuRowLeft}>
              <Trophy size={18} color={Tokens.colors.text} />
              <Text style={styles.menuRowLabel}>Accra Box Leagues & Ladders</Text>
            </View>
            <ChevronRight size={16} color={Tokens.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuRow, styles.menuRowBorder]}
            onPress={() => router.push('/venues')}
          >
            <View style={styles.menuRowLeft}>
              <Activity size={18} color={Tokens.colors.text} />
              <Text style={styles.menuRowLabel}>Accra Padel Clubs & Courts</Text>
            </View>
            <ChevronRight size={16} color={Tokens.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuRow, styles.menuRowBorder]}
            onPress={() => router.push('/settings')}
          >
            <View style={styles.menuRowLeft}>
              <Settings size={18} color={Tokens.colors.text} />
              <Text style={styles.menuRowLabel}>Settings & Data Preferences</Text>
            </View>
            <ChevronRight size={16} color={Tokens.colors.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Auth Actions (Logout / Login) */}
        <View style={styles.authActionSection}>
          {isAuthenticated ? (
            <Button
              title={t('authLogoutBtn')}
              variant="secondary"
              onPress={logout}
              testID="profile-logout-button"
            />
          ) : (
            <Button
              title={t('authSignInBtn')}
              variant="primary"
              onPress={() => router.push('/login' as any)}
              testID="profile-login-button"
            />
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Tokens.spacing.base,
    paddingBottom: Tokens.spacing.xxxl,
  },
  containerWide: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  profileCard: {
    padding: Tokens.spacing.base,
    gap: Tokens.spacing.base,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.base,
  },
  avatarBox: {
    width: 60,
    height: 60,
    borderRadius: Tokens.radii.card,
    backgroundColor: Tokens.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Tokens.colors.primaryBorder,
  },
  avatarInitials: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.lg,
    lineHeight: Tokens.lineHeight.lg,
    color: Tokens.colors.primaryText,
  },
  profileDetailsCol: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
  playerNameText: {
    ...Typography.headlineSm,
    color: Tokens.colors.text,
  },
  proBadge: {
    paddingHorizontal: Tokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: Tokens.radii.chip,
    backgroundColor: Tokens.colors.primaryLight,
    borderWidth: 1,
    borderColor: Tokens.colors.primaryBorder,
  },
  proBadgeText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.primaryText,
  },
  playerPhoneText: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  statusPillsRow: {
    flexDirection: 'row',
    gap: Tokens.spacing.xs,
    marginTop: 2,
  },
  metricsStrip: {
    flexDirection: 'row',
    backgroundColor: Tokens.colors.surfaceMuted,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    padding: Tokens.spacing.sm,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricBorder: {
    borderLeftWidth: 1,
    borderLeftColor: Tokens.colors.border,
  },
  metricLabel: {
    ...Typography.labelSm,
    color: Tokens.colors.textMuted,
    textTransform: 'uppercase',
  },
  metricValue: {
    ...Typography.labelMd,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  metricSub: {
    ...Typography.bodySm,
    color: Tokens.colors.greenText,
  },
  walletCard: {
    padding: Tokens.spacing.base,
    gap: Tokens.spacing.base,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.colors.border,
  },
  walletTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
  walletIconBox: {
    width: 36,
    height: 36,
    borderRadius: Tokens.radii.sm,
    backgroundColor: Tokens.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  walletTitle: {
    ...Typography.labelMd,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  walletSubtitle: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  balanceLabel: {
    ...Typography.labelSm,
    color: Tokens.colors.textMuted,
    textTransform: 'uppercase',
  },
  balanceValue: {
    ...Typography.headlineLg,
    color: Tokens.colors.text,
    marginTop: 2,
  },
  verifiedMomoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.pill,
    backgroundColor: Tokens.colors.primaryLight,
  },
  verifiedMomoText: {
    ...Typography.labelSm,
    color: Tokens.colors.greenText,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Tokens.spacing.base,
  },
  menuRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Tokens.colors.border,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
  menuRowLabel: {
    ...Typography.bodyMd,
    color: Tokens.colors.text,
  },
  authActionSection: {
    paddingTop: Tokens.spacing.sm,
  },
});
