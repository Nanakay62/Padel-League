import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
} from 'react-native';
import { X, CheckCircle2, ShieldCheck } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
import { MOMO_RAILS, type MoMoProviderId } from '@/constants/designSystem';
import { formatGhanaCedis } from '@/lib/formatting';
import { t } from '@/lib/i18n';
import { Button, CourtSeatDiagram, type CourtPlayer } from '@/components/ui';
import { type OpenMatchItem, calculateSeatFeePesewas } from '../utils/playTonightUtils';

export interface OpenMatchSeatModalProps {
  visible: boolean;
  match: OpenMatchItem | null;
  onClose: () => void;
  onConfirmReservation: (data: {
    matchId: string;
    provider: MoMoProviderId;
    feePesewas: number;
  }) => Promise<void> | void;
}

export function OpenMatchSeatModal({
  visible,
  match,
  onClose,
  onConfirmReservation,
}: OpenMatchSeatModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<MoMoProviderId>('mtn');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!match) return null;

  const perSeatFee = calculateSeatFeePesewas(
    match.courtCostPesewas,
    match.totalSeats
  );

  // Map confirmed players to court diagram format (4 seats)
  const courtPlayers: (CourtPlayer | null)[] = [
    match.confirmedPlayers[0]
      ? {
          id: match.confirmedPlayers[0].id,
          name: match.confirmedPlayers[0].name,
          initials: match.confirmedPlayers[0].initials,
          rating: match.confirmedPlayers[0].rating,
        }
      : null,
    match.confirmedPlayers[1]
      ? {
          id: match.confirmedPlayers[1].id,
          name: match.confirmedPlayers[1].name,
          initials: match.confirmedPlayers[1].initials,
          rating: match.confirmedPlayers[1].rating,
        }
      : null,
    match.confirmedPlayers[2]
      ? {
          id: match.confirmedPlayers[2].id,
          name: match.confirmedPlayers[2].name,
          initials: match.confirmedPlayers[2].initials,
          rating: match.confirmedPlayers[2].rating,
        }
      : null,
    match.confirmedPlayers[3]
      ? {
          id: match.confirmedPlayers[3].id,
          name: match.confirmedPlayers[3].name,
          initials: match.confirmedPlayers[3].initials,
          rating: match.confirmedPlayers[3].rating,
        }
      : null,
  ];

  const handleReserve = async () => {
    setIsSubmitting(true);
    try {
      await onConfirmReservation({
        matchId: match.id,
        provider: selectedProvider,
        feePesewas: perSeatFee,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const providers = Object.values(MOMO_RAILS);

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
            <View style={styles.headerTextCol}>
              <Text style={styles.venueTitle}>{match.venueName}</Text>
              <Text style={styles.courtSubtitle}>{match.courtName}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close reservation"
              onPress={onClose}
              style={styles.closeButton}
            >
              <X size={20} color={Tokens.colors.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* 4-Seat Court Visual */}
            <View style={styles.courtSection}>
              <Text style={styles.sectionLabel}>COURT LINEUP</Text>
              <CourtSeatDiagram
                players={courtPlayers}
                courtLabel={match.courtName}
              />
            </View>

            {/* Mobile Money Provider Selection */}
            <View style={styles.momoSection}>
              <Text style={styles.sectionLabel}>SELECT PAYMENT METHOD</Text>
              <View style={styles.providerRow}>
                {providers.map((rail) => {
                  const isSelected = selectedProvider === rail.id;
                  return (
                    <Pressable
                      key={rail.id}
                      accessibilityRole="button"
                      accessibilityLabel={rail.name}
                      onPress={() => setSelectedProvider(rail.id)}
                      style={[
                        styles.providerChip,
                        isSelected && { borderColor: rail.brandColor, borderWidth: 2 },
                      ]}
                    >
                      <View
                        style={[
                          styles.providerIndicator,
                          { backgroundColor: rail.brandColor },
                        ]}
                      />
                      <Text
                        style={[
                          styles.providerName,
                          isSelected && styles.providerNameSelected,
                        ]}
                      >
                        {rail.shortName}
                      </Text>
                      {isSelected ? (
                        <CheckCircle2 size={16} color={Tokens.colors.text} />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Price Split Summary */}
            <View style={styles.feeSummaryCard}>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Your Seat Split (1 of 4)</Text>
                <Text style={styles.feeAmount}>{formatGhanaCedis(perSeatFee)}</Text>
              </View>
              <View style={styles.securityBadge}>
                <ShieldCheck size={14} color={Tokens.colors.greenText} />
                <Text style={styles.securityText}>
                  Instant confirmation • Split only across confirmed seats
                </Text>
              </View>
            </View>

            {/* Reserve CTA Button */}
            <Button
              title={t('reserveSeatBtn')}
              variant="primary"
              loading={isSubmitting}
              onPress={handleReserve}
              testID="reserve-seat-btn"
              style={styles.reserveBtn}
            />
          </ScrollView>
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
    paddingTop: Tokens.spacing.lg,
    paddingHorizontal: Tokens.spacing.base,
    paddingBottom: Tokens.spacing.xl,
    maxHeight: '90%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Tokens.spacing.md,
  },
  headerTextCol: {
    flex: 1,
  },
  venueTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.lg,
    color: Tokens.colors.text,
  },
  courtSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.textMuted,
  },
  closeButton: {
    padding: Tokens.spacing.xs,
  },
  scrollBody: {
    gap: Tokens.spacing.base,
    paddingBottom: Tokens.spacing.lg,
  },
  courtSection: {
    gap: Tokens.spacing.xs,
  },
  sectionLabel: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.textMuted,
    letterSpacing: 0.8,
  },
  momoSection: {
    gap: Tokens.spacing.sm,
  },
  providerRow: {
    flexDirection: 'row',
    gap: Tokens.spacing.sm,
  },
  providerChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Tokens.spacing.xs,
    backgroundColor: Tokens.colors.chalk,
    borderRadius: Tokens.radii.card,
    paddingVertical: Tokens.spacing.md,
    paddingHorizontal: Tokens.spacing.xs,
    borderWidth: 1,
    borderColor: Tokens.colors.line,
  },
  providerIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  providerName: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.textMuted,
  },
  providerNameSelected: {
    color: Tokens.colors.text,
    fontWeight: Tokens.fontWeight.semibold,
  },
  feeSummaryCard: {
    backgroundColor: Tokens.colors.chalk,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.line,
    padding: Tokens.spacing.base,
    gap: Tokens.spacing.xs,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Tokens.fontSize.sm,
    color: Tokens.colors.text,
  },
  feeAmount: {
    fontFamily: Typography.fontFamily.display,
    fontWeight: Tokens.fontWeight.bold,
    fontSize: Tokens.fontSize.lg,
    color: Tokens.colors.text,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    marginTop: Tokens.spacing.xs,
  },
  securityText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.xxs,
    color: Tokens.colors.greenText,
  },
  reserveBtn: {
    marginTop: Tokens.spacing.xs,
  },
});
