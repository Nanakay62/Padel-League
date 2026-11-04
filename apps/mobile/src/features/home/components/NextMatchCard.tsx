import React from 'react';
import {
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Share2 } from 'lucide-react-native';
import { Tokens, Typography, Fonts } from '@/constants/theme';
import { t } from '@/lib/i18n';
import {
  StatusChip,
  ProgressSegments,
  CourtSeatDiagram,
  PlayerAvatar,
  Button,
} from '@/components/ui';

export interface NextMatchCardProps {
  isDesktop: boolean;
}

export function NextMatchCard({ isDesktop }: NextMatchCardProps) {
  const router = useRouter();

  const courtPlayers = [
    { id: 'p1', initials: 'KA', name: 'Kofi', rating: '3.6' },
    { id: 'p2', initials: 'NK', name: 'Nana (you)', rating: '3.4', isCurrentUser: true },
    { id: 'p3', initials: 'YB', name: 'Yaw', rating: '3.8' },
    null,
  ];

  const handleShare = async () => {
    try {
      interface WebShareNavigator {
        share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
      }
      const nav = typeof navigator !== 'undefined' ? (navigator as unknown as WebShareNavigator) : undefined;
      if (Platform.OS === 'web' && nav?.share) {
        await nav.share({
          title: 'Thursday Americano on Padel Ghana',
          text: 'Join me for Thursday Americano at Accra Padel Club!',
          url: 'https://padelghana.com/events/evt-001',
        });
      } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const url = encodeURIComponent('https://padelghana.com/events/evt-001');
        const text = encodeURIComponent('Join me for Thursday Americano at Accra Padel Club on Padel Ghana!');
        window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
      } else {
        await Share.share({
          message: 'Join me for Thursday Americano at Accra Padel Club! https://padelghana.com/events/evt-001',
        });
      }
    } catch {
      // Fallback
    }
  };

  return (
    <View style={[styles.focalCard, isDesktop ? styles.focalCardDesktop : styles.focalCardMobile]}>
      <View style={[styles.focalTopRow, isDesktop ? styles.focalTopRowDesktop : styles.focalTopRowMobile]}>
        <View style={styles.focalLeftCol}>
          <View style={styles.focalEyebrowRow}>
            <StatusChip status="confirmed" onDark label={t('confirmedBadge')} />
            <Text style={styles.focalEyebrowText}>{t('nextGameTag')}</Text>
          </View>

          <Text style={[styles.focalTitle, isDesktop ? styles.focalTitleDesktop : styles.focalTitleMobile]}>
            Thursday Americano
          </Text>

          <View style={styles.focalMetaRow}>
            <Text style={styles.focalMeta}>Thu, 6:00 PM</Text>
            <Text style={styles.focalMetaBullet}> · </Text>
            <Text style={styles.focalMeta}>Accra Padel Club • Court 2 & 3</Text>
            <Text style={styles.focalMetaBullet}> · </Text>
            <Text style={styles.focalMeta}>Airport Residential Area, Accra</Text>
          </View>

          <View style={styles.detailsList}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('levelLabel')}</Text>
              <Text style={styles.detailValue}>Intermediate 3.0-4.0</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('formatLabel')}</Text>
              <Text style={styles.detailValue}>Timed Americano (21 pts)</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('capacityLabel')}</Text>
              <View style={styles.capacityTextRow}>
                <Text style={styles.detailValue}>8/12 players</Text>
                <Text style={styles.detailValueMuted}> (8 of 12 joined)</Text>
              </View>
              <ProgressSegments
                total={12}
                filled={8}
                segmentHeight={8}
                onDark={true}
                style={styles.segmentedProgress}
              />
            </View>
          </View>
        </View>

        {isDesktop ? (
          <View style={styles.focalRightCol}>
            <CourtSeatDiagram
              courtLabel="COURT 2 · STARTING FOUR"
              players={courtPlayers}
              onOpenSpotPress={() => router.push('/events/evt-001')}
            />
          </View>
        ) : (
          <View style={styles.mobileCourtPreview}>
            <Text style={styles.mobileCourtLabel}>COURT 2 · STARTING FOUR</Text>
            <View style={styles.avatarStackRow}>
              <PlayerAvatar initials="KA" size={44} style={styles.stackAvatar1} />
              <PlayerAvatar initials="NK" size={44} isCurrentUser style={styles.stackAvatar2} />
              <PlayerAvatar initials="YB" size={44} style={styles.stackAvatar3} />
              <Pressable
                style={styles.stackOpenBadge}
                onPress={() => router.push('/events/evt-001')}
                accessibilityRole="button"
                accessibilityLabel="Join open spot"
              >
                <Plus size={16} color={Tokens.colors.chalk} strokeWidth={2} />
              </Pressable>
            </View>
          </View>
        )}
      </View>

      <View style={styles.focalDivider} />

      <View style={styles.focalFooter}>
        <View style={styles.priceCol}>
          <Text style={styles.priceValue}>GH₵ 85.00</Text>
          <Text style={styles.paymentMethodText}>{t('paidViaMoMo')}</Text>
        </View>

        <View style={styles.focalActionsRow}>
          <Button
            variant="outlineOnDark"
            title="Share on WhatsApp"
            icon={<Share2 size={16} color={Tokens.colors.onInk} strokeWidth={2} />}
            onPress={handleShare}
            accessibilityLabel="Share on WhatsApp"
          />
          <Button
            testID="home-view-session-btn"
            variant="primary"
            title="Open game"
            onPress={() => router.push('/events/evt-001')}
            accessibilityLabel="Open game"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  focalCard: {
    backgroundColor: Tokens.colors.ink,
    borderRadius: Tokens.radii.hero,
    overflow: 'hidden',
  },
  focalCardDesktop: {
    flex: 1.6,
    padding: Tokens.spacing.xxl,
  },
  focalCardMobile: {
    width: '100%',
    padding: Tokens.spacing.lg,
  },
  focalTopRow: {
    width: '100%',
  },
  focalTopRowDesktop: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Tokens.spacing.xxl,
  },
  focalTopRowMobile: {
    flexDirection: 'column',
    gap: Tokens.spacing.lg,
  },
  focalLeftCol: {
    flex: 1,
  },
  focalRightCol: {
    width: 280,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  focalEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
    marginBottom: Tokens.spacing.sm,
  },
  focalEyebrowText: {
    fontFamily: Fonts.mono,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.lime,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: Tokens.fontWeight.bold,
  },
  focalTitle: {
    fontFamily: Typography.fontFamily.display,
    color: Tokens.colors.onInk,
    fontWeight: Tokens.fontWeight.bold,
    letterSpacing: -0.6,
    marginBottom: Tokens.spacing.xs,
  },
  focalTitleDesktop: {
    fontSize: Tokens.fontSize.xxl,
    lineHeight: Tokens.lineHeight.xxl,
  },
  focalTitleMobile: {
    fontSize: Tokens.fontSize.xl,
    lineHeight: Tokens.lineHeight.xl,
  },
  focalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: Tokens.spacing.lg,
  },
  focalMeta: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.onInkMuted,
  },
  focalMetaBullet: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.sm,
    color: Tokens.colors.onInkMuted,
  },
  detailsList: {
    gap: Tokens.spacing.sm,
  },
  detailItem: {
    gap: 4,
  },
  detailLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.onInkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.onInk,
  },
  capacityTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailValueMuted: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.onInkMuted,
  },
  segmentedProgress: {
    marginTop: 4,
  },
  mobileCourtPreview: {
    paddingTop: Tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Tokens.colors.onInkMuted,
  },
  mobileCourtLabel: {
    fontFamily: Fonts.mono,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.lime,
    letterSpacing: 1.2,
    marginBottom: Tokens.spacing.sm,
    fontWeight: Tokens.fontWeight.bold,
  },
  avatarStackRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackAvatar1: { zIndex: 4 },
  stackAvatar2: { zIndex: 3, marginLeft: -Tokens.spacing.sm },
  stackAvatar3: { zIndex: 2, marginLeft: -Tokens.spacing.sm },
  stackOpenBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Tokens.colors.chalk,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -Tokens.spacing.sm,
    zIndex: 1,
  },
  focalDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginVertical: Tokens.spacing.lg,
  },
  focalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Tokens.spacing.md,
  },
  priceCol: {
    gap: 2,
  },
  priceValue: {
    fontFamily: Typography.fontFamily.display,
    fontSize: Tokens.fontSize.xl,
    lineHeight: Tokens.lineHeight.xl,
    fontWeight: Tokens.fontWeight.bold,
    color: Tokens.colors.onInk,
    letterSpacing: -0.5,
  },
  paymentMethodText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.onInkMuted,
  },
  focalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
});
