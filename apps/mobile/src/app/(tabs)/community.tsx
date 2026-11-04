import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Users, Shield, Trophy, Award, ChevronRight, UserCheck } from 'lucide-react-native';
import { Tokens, Typography, useResponsiveLayout } from '@/constants/theme';
import { Screen, Card, CircuitBanner, WhatsAppIcon } from '@/components/ui';
import { t } from '@/lib/i18n';

export default function CommunityTabScreen() {
  const router = useRouter();
  const { isDesktop, isTablet } = useResponsiveLayout();

  const handleOpenWhatsAppCommunity = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  return (
    <Screen>
      <CircuitBanner
        title={t('communityAccraBannerTitle')}
        description={t('communityAccraBannerDesc')}
        testID="community-banner-card"
        stats={[
          {
            icon: <Users size={14} color={Tokens.colors.gold} strokeWidth={1.75} />,
            label: t('communityGhanaNetwork'),
          },
          {
            icon: <Shield size={14} color={Tokens.colors.bannerBlueIcon} strokeWidth={1.75} />,
            label: t('communityVerifiedPlayers'),
          },
        ]}
      />

      <View style={[styles.container, (isDesktop || isTablet) && styles.containerWide]}>
        {/* Matchmaking & Partner Finder Card */}
        <Card style={styles.card}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/partners')}
            accessibilityRole="button"
            accessibilityLabel={t('communityFindPartnersTitle')}
          >
            <View style={styles.iconCircle}>
              <UserCheck size={22} color={Tokens.colors.lime} strokeWidth={2} />
            </View>
            <View style={styles.actionCol}>
              <Text style={styles.cardTitle}>{t('communityFindPartnersTitle')}</Text>
              <Text style={styles.cardDescription}>
                {t('communityFindPartnersDesc')}
              </Text>
            </View>
            <ChevronRight size={18} color={Tokens.colors.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Accra Box Leagues Card */}
        <Card style={styles.card}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/(tabs)/leagues' as Href)}
            accessibilityRole="button"
            accessibilityLabel={t('communityBoxLeaguesTitle')}
          >
            <View style={styles.iconCircle}>
              <Trophy size={22} color={Tokens.colors.lime} strokeWidth={2} />
            </View>
            <View style={styles.actionCol}>
              <Text style={styles.cardTitle}>{t('communityBoxLeaguesTitle')}</Text>
              <Text style={styles.cardDescription}>
                {t('communityBoxLeaguesDesc')}
              </Text>
            </View>
            <ChevronRight size={18} color={Tokens.colors.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Ghana Padel Rating Card */}
        <Card style={styles.card}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/ratings')}
            accessibilityRole="button"
            accessibilityLabel={t('communityRatingBandsTitle')}
          >
            <View style={styles.iconCircle}>
              <Award size={22} color={Tokens.colors.lime} strokeWidth={2} />
            </View>
            <View style={styles.actionCol}>
              <Text style={styles.cardTitle}>{t('communityRatingBandsTitle')}</Text>
              <Text style={styles.cardDescription}>
                {t('communityRatingBandsDesc')}
              </Text>
            </View>
            <ChevronRight size={18} color={Tokens.colors.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Verified Club WhatsApp Communities */}
        <Card style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.iconCircle}>
              <WhatsAppIcon size={22} color={Tokens.colors.lime} testID="community-whatsapp-icon" />
            </View>
            <View style={styles.actionCol}>
              <Text style={styles.cardTitle}>{t('communityClubChannelsTitle')}</Text>
              <Text style={styles.cardDescription}>
                {t('communityClubChannelsDesc')}
              </Text>
            </View>
          </View>

          <View style={styles.channelList}>
            <TouchableOpacity
              style={styles.channelItem}
              onPress={() => handleOpenWhatsAppCommunity('https://chat.whatsapp.com/accra-city-padel')}
            >
              <Text style={styles.channelName}>{t('communityAccraCityChannel')}</Text>
              <Text style={styles.channelAction}>{t('communityOpenWhatsApp')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.channelItem, styles.channelItemBorder]}
              onPress={() => handleOpenWhatsAppCommunity('https://chat.whatsapp.com/east-legon-padel')}
            >
              <Text style={styles.channelName}>{t('communityEastLegonChannel')}</Text>
              <Text style={styles.channelAction}>{t('communityOpenWhatsApp')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.channelItem, styles.channelItemBorder]}
              onPress={() => handleOpenWhatsAppCommunity('https://chat.whatsapp.com/cantonments-padel')}
            >
              <Text style={styles.channelName}>{t('communityCantonmentsChannel')}</Text>
              <Text style={styles.channelAction}>{t('communityOpenWhatsApp')}</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Tokens.spacing.xl,
    gap: Tokens.spacing.base,
    paddingBottom: Tokens.spacing.xxxl,
  },
  containerWide: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  card: {
    padding: Tokens.spacing.lg,
    gap: Tokens.spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Tokens.spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: Tokens.radii.card,
    backgroundColor: Tokens.colors.ink,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCol: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontFamily: Typography.fontFamily.display,
    fontWeight: Tokens.fontWeight.bold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    color: Tokens.colors.text,
  },
  cardDescription: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.textMuted,
  },
  channelList: {
    marginTop: Tokens.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Tokens.colors.border,
    paddingTop: Tokens.spacing.xs,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Tokens.spacing.sm,
  },
  channelItemBorder: {
    borderTopWidth: 1,
    borderTopColor: Tokens.colors.border,
  },
  channelName: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Tokens.fontSize.sm,
    color: Tokens.colors.text,
  },
  channelAction: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.primaryText,
  },
});
