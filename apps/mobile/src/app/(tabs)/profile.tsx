import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Settings,
  ChevronRight,
  Trophy,
  Activity,
  Award,
  Shield,
  Camera,
} from 'lucide-react-native';
import { Tokens, Typography, useResponsiveLayout } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Screen, Card, StatusPill, Button, CircuitBanner } from '@/components/ui';
import { courtsideScoreQueue } from '@/lib/offlineQueue';
import { apiFetch } from '@/lib/api-client';

export default function ProfileTabScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout, deleteAccount, refreshProfile } = useAuth();
  const { isDesktop, isTablet } = useResponsiveLayout();
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleSelectFile = () => {
    if (Platform.OS === 'web' && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      Alert.alert('File Too Large', 'Please select a photo under 5 MB.');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      setIsUploading(true);
      const res = await apiFetch('/me/avatar', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        await refreshProfile();
        Alert.alert('Photo Updated', 'Your profile picture has been saved.');
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Upload Failed', err.detail || 'Could not upload photo.');
      }
    } catch (err: any) {
      Alert.alert('Upload Error', err.message || 'An error occurred uploading photo.');
    } finally {
      setIsUploading(false);
    }
  };

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
      <CircuitBanner
        badge="PLAYER CIRCUIT ID"
        title={t('placeholderProfileTitle')}
        description={`Player Account & Circuit Profile • ${playerPhone}`}
        testID="profile-banner-card"
        stats={[
          {
            icon: <Award size={14} color={Tokens.colors.gold} strokeWidth={1.75} />,
            label: hasRating ? `GPR ${playerRating}` : 'Unrated / Placement',
          },
          {
            icon: <Shield size={14} color={Tokens.colors.bannerBlueIcon} strokeWidth={1.75} />,
            label: isAuthenticated ? 'Verified Account' : 'Guest Mode',
          },
        ]}
      />

      <View style={[styles.container, (isDesktop || isTablet) && styles.containerWide]}>
        {/* Main Profile Info Card */}
        <Card style={styles.profileCard}>
          {Platform.OS === 'web' && (
            <input
              type="file"
              ref={fileInputRef as any}
              style={{ display: 'none' }}
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
            />
          )}

          <View style={styles.profileHeaderRow}>
            <TouchableOpacity
              style={styles.avatarBox}
              onPress={handleSelectFile}
              disabled={!isAuthenticated || isUploading}
              accessibilityRole="button"
              accessibilityLabel="Change profile picture"
              testID="profile-avatar-button"
            >
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>{avatarInitials}</Text>
              )}
              {isAuthenticated && (
                <View style={styles.cameraIconBadge}>
                  {isUploading ? (
                    <ActivityIndicator size="small" color={Tokens.colors.primaryForeground} />
                  ) : (
                    <Camera size={12} color={Tokens.colors.primaryForeground} />
                  )}
                </View>
              )}
            </TouchableOpacity>

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
                onPress={() => router.push('/(tabs)/leagues' as any)}
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
            onPress={() => router.push('/(tabs)/leagues' as any)}
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
    width: 64,
    height: 64,
    borderRadius: Tokens.radii.card,
    backgroundColor: Tokens.colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: Tokens.radii.card,
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: Tokens.colors.primary,
    width: 20,
    height: 20,
    borderRadius: Tokens.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Tokens.colors.card,
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
