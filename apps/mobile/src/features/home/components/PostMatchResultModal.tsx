import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { X, Trophy, ArrowUpRight } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { Button, WhatsAppIcon } from '@/components/ui';

export interface PostMatchResultModalProps {
  visible: boolean;
  matchTitle: string;
  venueName: string;
  score: string;
  isWinner: boolean;
  ratingBefore: number;
  ratingAfter: number;
  ratingDelta: number;
  onShareWhatsApp: () => void;
  onPlayAgain: () => void;
  onClose: () => void;
}

export function PostMatchResultModal({
  visible,
  matchTitle,
  venueName,
  score,
  isWinner,
  ratingBefore,
  ratingAfter,
  ratingDelta,
  onShareWhatsApp,
  onPlayAgain,
  onClose,
}: PostMatchResultModalProps) {
  if (!visible) return null;

  const deltaFormatted =
    ratingDelta >= 0 ? `+${ratingDelta.toFixed(2)}` : ratingDelta.toFixed(2);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.trophyCircle}>
              <Trophy size={24} color={Tokens.colors.ink} />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close match results"
              onPress={onClose}
              style={styles.closeBtn}
            >
              <X size={20} color={Tokens.colors.text} />
            </Pressable>
          </View>

          {/* Title & Venue */}
          <Text style={styles.title}>{t('postMatchCompleted')}</Text>
          <Text style={styles.subtitle}>
            {matchTitle} • {venueName}
          </Text>

          {/* Scoreboard Card */}
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>FINAL SCORE</Text>
            <Text style={styles.scoreValue}>{score}</Text>
          </View>

          {/* Rating Delta Card */}
          <View style={styles.ratingDeltaCard}>
            <View style={styles.ratingCol}>
              <Text style={styles.ratingLabel}>PREVIOUS</Text>
              <Text style={styles.ratingVal}>{ratingBefore.toFixed(2)}</Text>
            </View>
            <View style={styles.deltaBadge}>
              <ArrowUpRight size={14} color={Tokens.colors.ink} />
              <Text style={styles.deltaText}>{deltaFormatted}</Text>
            </View>
            <View style={styles.ratingCol}>
              <Text style={styles.ratingLabel}>NEW LEVEL</Text>
              <Text style={styles.ratingValNew}>{ratingAfter.toFixed(2)}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsColumn}>
            <Button
              title={t('shareOnWhatsAppBtn')}
              variant="ink"
              icon={<WhatsAppIcon size={18} color={Tokens.colors.onInk} />}
              onPress={onShareWhatsApp}
              testID="whatsapp-share-btn"
            />
            <Button
              title={t('playAgainBtn')}
              variant="primary"
              onPress={onPlayAgain}
              testID="play-again-btn"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Tokens.colors.card,
    borderTopLeftRadius: Tokens.radii.hero,
    borderTopRightRadius: Tokens.radii.hero,
    padding: Tokens.spacing.xl,
    gap: Tokens.spacing.base,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trophyCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Tokens.colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: Tokens.spacing.xs,
  },
  title: {
    fontFamily: Typography.fontFamily.display,
    fontSize: Tokens.fontSize.xxl,
    lineHeight: Tokens.lineHeight.xxl,
    fontWeight: Tokens.fontWeight.bold,
    color: Tokens.colors.text,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.sm,
    color: Tokens.colors.textMuted,
  },
  scoreCard: {
    backgroundColor: Tokens.colors.chalk,
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Tokens.colors.line,
  },
  scoreLabel: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.textMuted,
    letterSpacing: 1.0,
    marginBottom: Tokens.spacing.xs,
  },
  scoreValue: {
    fontFamily: Typography.fontFamily.display,
    fontSize: Tokens.fontSize.display,
    lineHeight: Tokens.lineHeight.display,
    fontWeight: Tokens.fontWeight.bold,
    color: Tokens.colors.text,
  },
  ratingDeltaCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Tokens.colors.chalk,
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.base,
    borderWidth: 1,
    borderColor: Tokens.colors.line,
  },
  ratingCol: {
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  ratingLabel: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.textMuted,
  },
  ratingVal: {
    fontFamily: Typography.fontFamily.display,
    fontSize: Tokens.fontSize.lg,
    fontWeight: Tokens.fontWeight.bold,
    color: Tokens.colors.textMuted,
  },
  ratingValNew: {
    fontFamily: Typography.fontFamily.display,
    fontSize: Tokens.fontSize.xl,
    fontWeight: Tokens.fontWeight.bold,
    color: Tokens.colors.text,
  },
  deltaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Tokens.colors.lime,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.pill,
  },
  deltaText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.bold,
    color: Tokens.colors.ink,
  },
  actionsColumn: {
    gap: Tokens.spacing.sm,
    marginTop: Tokens.spacing.xs,
  },
});
