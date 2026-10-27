import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Users, Shield, Trophy, Award, MessageCircle, ChevronRight, UserCheck } from 'lucide-react-native';
import { Tokens, Typography, useResponsiveLayout } from '@/constants/theme';
import { Screen, Card, CircuitBanner } from '@/components/ui';

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
        title="Accra Padel Community"
        description="Connect with Accra padel players, find hitting partners, and join club community channels."
        testID="community-banner-card"
        stats={[
          {
            icon: <Users size={14} color={Tokens.colors.gold} strokeWidth={1.75} />,
            label: 'Ghana Padel Network',
          },
          {
            icon: <Shield size={14} color={Tokens.colors.bannerBlueIcon} strokeWidth={1.75} />,
            label: 'Verified Players Only',
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
            accessibilityLabel="Find Hitting Partners"
          >
            <View style={styles.iconCircle}>
              <UserCheck size={22} color={Tokens.colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.actionCol}>
              <Text style={styles.cardTitle}>Find Hitting Partners</Text>
              <Text style={styles.cardDescription}>
                Browse verified Accra players by level band, court side preference, and home venue.
              </Text>
            </View>
            <ChevronRight size={18} color={Tokens.colors.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Accra Box Leagues Card */}
        <Card style={styles.card}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/(tabs)/leagues' as any)}
            accessibilityRole="button"
            accessibilityLabel="Accra Box Leagues"
          >
            <View style={styles.iconCircle}>
              <Trophy size={22} color={Tokens.colors.gold} strokeWidth={2} />
            </View>
            <View style={styles.actionCol}>
              <Text style={styles.cardTitle}>Accra Box Leagues & Ladders</Text>
              <Text style={styles.cardDescription}>
                Compete in monthly round-robin division boxes with promotion and relegation cycles.
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
            accessibilityLabel="Player Ratings and Level Calibration"
          >
            <View style={styles.iconCircle}>
              <Award size={22} color={Tokens.colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.actionCol}>
              <Text style={styles.cardTitle}>Ghana Padel Rating & Level Bands</Text>
              <Text style={styles.cardDescription}>
                Check your calibrated GPR score, match reliability index, and level breakdown.
              </Text>
            </View>
            <ChevronRight size={18} color={Tokens.colors.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Verified Club WhatsApp Communities */}
        <Card style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.iconCircle}>
              <MessageCircle size={22} color={Tokens.colors.greenText} strokeWidth={2} />
            </View>
            <View style={styles.actionCol}>
              <Text style={styles.cardTitle}>Club WhatsApp Channels</Text>
              <Text style={styles.cardDescription}>
                Official group chats for organizing social hits, doubles pairings, and court talk.
              </Text>
            </View>
          </View>

          <View style={styles.channelList}>
            <TouchableOpacity
              style={styles.channelItem}
              onPress={() => handleOpenWhatsAppCommunity('https://chat.whatsapp.com/accra-city-padel')}
            >
              <Text style={styles.channelName}>Accra City Padel Club Channel</Text>
              <Text style={styles.channelAction}>Open WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.channelItem, styles.channelItemBorder]}
              onPress={() => handleOpenWhatsAppCommunity('https://chat.whatsapp.com/east-legon-padel')}
            >
              <Text style={styles.channelName}>East Legon Padel Community</Text>
              <Text style={styles.channelAction}>Open WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.channelItem, styles.channelItemBorder]}
              onPress={() => handleOpenWhatsAppCommunity('https://chat.whatsapp.com/cantonments-padel')}
            >
              <Text style={styles.channelName}>Cantonments Social Padel Group</Text>
              <Text style={styles.channelAction}>Open WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </Card>
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
    backgroundColor: Tokens.colors.surfaceContainer,
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
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
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
