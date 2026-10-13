import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
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
import { courtsideScoreQueue } from '@/lib/offlineQueue';

export default function ProfileTabScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout, deleteAccount } = useAuth();
  const { isDesktop, isTablet } = useResponsiveLayout();

  const playerName = isAuthenticated && user?.name ? user.name : t('guestPlayer');
  const playerPhone =
    isAuthenticated && user?.phone_e164 ? user.phone_e164 : t('guestNoPhone');
  const hasRating = isAuthenticated && user?.level !== undefined && user?.level !== null;
  const playerRating = hasRating ? user.level!.toFixed(2) : null;
  const avatarInitials = isAuthenticated && user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'P'
    : 'GP';

  const handleLogoutPress = () => {
    const pendingScoreCount = courtsideScoreQueue.size();
    if (pendingScoreCount > 0) {
      Alert.alert(
        t('profileLogoutOfflineWarningTitle'),
        t('profileLogoutOfflineWarningMessage', { count: pendingScoreCount }),
        [
          { text: t('profileDeleteAccountCancelAction'), style: 'cancel' },
          {
            text: t('profileLogoutAnyway'),
            style: 'destructive',
            onPress: () => logout(),
          },
        ]
      );
      return;
    }
    logout();
  };

  const handleDeleteAccountPress = () => {
    Alert.alert(
      t('profileDeleteAccountConfirmTitle'),
      t('profileDeleteAccountConfirmMessage'),
      [
        { text: t('profileDeleteAccountCancelAction'), style: 'cancel' },
        {
          text: t('profileDeleteAccountConfirmAction'),
          style: 'destructive',
          onPress: () => deleteAccount(),
        },
      ]
    );
  };

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
              <Text style={styles.avatarInitials}>{avatarInitials}</Text>
            </View>

            <View style={styles.profileDetailsCol}>
              <View style={styles.nameRow}>
                <Text style={styles.playerNameText}>{playerName}</Text>
              </View>
              <Text style={styles.playerPhoneText}>{playerPhone}</Text>
              <View style={styles.statusPillsRow}>
                <StatusPill
                  label={isAuthenticated ? 'SIGNED IN' : 'GUEST'}
                  variant={isAuthenticated ? 'success' : 'neutral'}
                />
                {isAuthenticated && user?.is_provisional && (
                  <StatusPill label={t('ratingProvisionalTag')} variant="neutral" />
                )}
              </View>
            </View>
          </View>

          {/* Guest Onboarding Prompt */}
          {!isAuthenticated ? (
            <View style={styles.guestActionBanner}>
              <Text style={styles.guestBannerText}>{t('guestSignInPrompt')}</Text>
              <View style={styles.guestBtnRow}>
                <Button
                  title={t('guestSignInBtn')}
                  variant="primary"
                  size="sm"
                  onPress={() =>
                    router.push({
                      pathname: '/login',
                      params: { redirect: '/profile' },
                    })
                  }
                  testID="profile-guest-signin-button"
                />
                <Button
                  title={t('guestSetLevelBtn')}
                  variant="secondary"
                  size="sm"
                  onPress={() => router.push('/onboarding' as any)}
                  testID="profile-guest-set-level-button"
                />
              </View>
            </View>
          ) : (
            /* Authenticated Quick Metrics Strip */
            <View style={styles.metricsStrip}>
              <TouchableOpacity
                style={styles.metricItem}
                onPress={() => router.push('/ratings')}
              >
                <Text style={styles.metricLabel}>PG Rating</Text>
                <Text style={[styles.metricValue, Typography.tabularNums]}>
                  {playerRating ? `Level ${playerRating}` : 'Not Calibrated'}
                </Text>
                <Text style={styles.metricSub}>
                  {user?.level_band || 'Calibrate Level'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.metricItem, styles.metricBorder]}
                onPress={() => router.push('/leagues')}
              >
                <Text style={styles.metricLabel}>Accra Circuit</Text>
                <Text style={styles.metricValue}>Active</Text>
                <Text style={styles.metricSub}>Box Leagues</Text>
              </TouchableOpacity>
            </View>
          )}
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

        {/* Auth Actions (Logout / Login / Account Deletion) */}
        <View style={styles.authActionSection}>
          {isAuthenticated ? (
            <View style={styles.authenticatedActionsCol}>
              <Button
                title={t('authLogoutBtn')}
                variant="secondary"
                onPress={handleLogoutPress}
                testID="profile-logout-button"
              />
              <Button
                title={t('profileDeleteAccountBtn')}
                variant="danger"
                onPress={handleDeleteAccountPress}
                testID="profile-delete-account-button"
              />
              <Text style={styles.gdprNoticeText}>
                Data Protection Act 843: Personal information is permanently removed upon account deletion. Match results are preserved as anonymised historic records.
              </Text>
            </View>
          ) : (
            <Button
              title={t('authSignInBtn')}
              variant="primary"
              onPress={() =>
                router.push({
                  pathname: '/login',
                  params: { redirect: '/profile' },
                })
              }
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
    backgroundColor: Tokens.colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  avatarInitials: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.lg,
    lineHeight: Tokens.lineHeight.lg,
    color: Tokens.colors.text,
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
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xl,
    lineHeight: Tokens.lineHeight.xl,
    color: Tokens.colors.text,
  },
  playerPhoneText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.sm,
    color: Tokens.colors.textMuted,
  },
  statusPillsRow: {
    flexDirection: 'row',
    gap: Tokens.spacing.xs,
    marginTop: 2,
  },
  guestActionBanner: {
    backgroundColor: Tokens.colors.surfaceContainerLow,
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.base,
    gap: Tokens.spacing.md,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  guestBannerText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textMuted,
  },
  guestBtnRow: {
    flexDirection: 'row',
    gap: Tokens.spacing.sm,
  },
  metricsStrip: {
    flexDirection: 'row',
    backgroundColor: Tokens.colors.surfaceContainerLow,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    overflow: 'hidden',
  },
  metricItem: {
    flex: 1,
    padding: Tokens.spacing.md,
    alignItems: 'center',
  },
  metricBorder: {
    borderLeftWidth: 1,
    borderLeftColor: Tokens.colors.border,
  },
  metricLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.lg,
    color: Tokens.colors.text,
    marginVertical: 2,
  },
  metricSub: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.primaryText,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Tokens.spacing.base,
  },
  menuRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Tokens.colors.border,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.md,
  },
  menuRowLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Tokens.fontSize.base,
    color: Tokens.colors.text,
  },
  authActionSection: {
    marginTop: Tokens.spacing.sm,
  },
  authenticatedActionsCol: {
    gap: Tokens.spacing.md,
  },
  gdprNoticeText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Tokens.spacing.md,
  },
});
