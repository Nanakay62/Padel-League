import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { X, Trophy, Swords, MapPin, Clock, Check } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
import { Card, Button } from '@/components/ui';

export interface DefenderOption {
  id: string;
  name: string;
  rung: number;
  rating: number;
  venue?: string;
}

export interface CreateChallengeModalProps {
  visible: boolean;
  onClose: () => void;
  challengerPair?: {
    name: string;
    rung: number;
    rating: number;
  };
  eligibleDefenders: DefenderOption[];
  initialDefenderId?: string;
  onSubmitChallenge: (data: {
    defenderId: string;
    venue: string;
    timeSlot: string;
    notes?: string;
  }) => void;
}

const VENUES = [
  'Accra Padel Arena',
  'East Legon Padel Club',
  'Cantonments Social Club',
  'Airport Residential Club',
];

const TIME_SLOTS = [
  'Tomorrow, 6:00 PM',
  'Saturday, 8:00 AM',
  'Saturday, 4:30 PM',
  'Sunday, 9:00 AM',
];

export function CreateChallengeModal({
  visible,
  onClose,
  challengerPair = {
    name: 'Kwame A. & Partner',
    rung: 4,
    rating: 4.35,
  },
  eligibleDefenders,
  initialDefenderId,
  onSubmitChallenge,
}: CreateChallengeModalProps) {
  const [userSelectedDefenderId, setUserSelectedDefenderId] = useState<string | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<string>(VENUES[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(TIME_SLOTS[0]);

  const activeDefenderId =
    userSelectedDefenderId ?? initialDefenderId ?? eligibleDefenders[0]?.id ?? '';

  const selectedDefender =
    eligibleDefenders.find((d) => d.id === activeDefenderId) || eligibleDefenders[0];

  const handleSubmit = () => {
    if (!selectedDefender) return;
    onSubmitChallenge({
      defenderId: selectedDefender.id,
      venue: selectedVenue,
      timeSlot: selectedTimeSlot,
    });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.swordsIconCircle}>
                <Swords size={18} color={Tokens.colors.primary} strokeWidth={2} />
              </View>
              <Text style={styles.headerTitle}>Issue Ladder Challenge</Text>
            </View>
            <Pressable
              testID="challenge-modal-close-btn"
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={20} color={Tokens.colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Challenger Card */}
            <View style={styles.roleCardChallenger}>
              <View style={styles.roleHeaderRow}>
                <Text style={styles.roleTag}>Challenger (You)</Text>
                <Text style={[styles.rungPillText, Typography.tabularNums]}>
                  Rung #{challengerPair.rung}
                </Text>
              </View>
              <Text style={styles.roleTeamName}>{challengerPair.name}</Text>
              <Text style={[styles.ratingSubtext, Typography.tabularNums]}>
                PG Rating: {challengerPair.rating.toFixed(2)}
              </Text>
            </View>

            {/* Defender Selector */}
            <View style={styles.sectionGroup}>
              <Text style={styles.sectionLabel}>
                SELECT DEFENDER (Within 3-Rung Window)
              </Text>
              <View style={styles.defendersList}>
                {eligibleDefenders.map((defender) => {
                  const isSelected = defender.id === activeDefenderId;
                  return (
                    <TouchableOpacity
                      key={defender.id}
                      style={[
                        styles.defenderSelectCard,
                        isSelected && styles.defenderSelectCardActive,
                      ]}
                      onPress={() => setUserSelectedDefenderId(defender.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.defenderCardLeft}>
                        <View
                          style={[
                            styles.defenderRungBadge,
                            isSelected && styles.defenderRungBadgeActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.defenderRungText,
                              isSelected && styles.defenderRungTextActive,
                              Typography.tabularNums,
                            ]}
                          >
                            #{defender.rung}
                          </Text>
                        </View>
                        <View style={styles.defenderInfoCol}>
                          <Text
                            style={[
                              styles.defenderNameText,
                              isSelected && styles.defenderNameTextActive,
                            ]}
                          >
                            {defender.name}
                          </Text>
                          <Text style={styles.defenderClubText}>
                            {defender.venue || 'Accra Padel Arena'} • Rating:{' '}
                            {defender.rating.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                      {isSelected ? (
                        <View style={styles.checkCircle}>
                          <Check size={14} color={Tokens.colors.textOnPrimary} strokeWidth={2.5} />
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Venue Picker */}
            <View style={styles.sectionGroup}>
              <View style={styles.labelWithIconRow}>
                <MapPin size={14} color={Tokens.colors.textMuted} />
                <Text style={styles.sectionLabel}>MATCH VENUE</Text>
              </View>
              <View style={styles.chipsRow}>
                {VENUES.map((v) => (
                  <Pressable
                    key={v}
                    style={[
                      styles.pickerChip,
                      selectedVenue === v && styles.pickerChipActive,
                    ]}
                    onPress={() => setSelectedVenue(v)}
                  >
                    <Text
                      style={[
                        styles.pickerChipText,
                        selectedVenue === v && styles.pickerChipTextActive,
                      ]}
                    >
                      {v}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Proposed Time Slot */}
            <View style={styles.sectionGroup}>
              <View style={styles.labelWithIconRow}>
                <Clock size={14} color={Tokens.colors.textMuted} />
                <Text style={styles.sectionLabel}>PROPOSED TIME SLOT</Text>
              </View>
              <View style={styles.chipsRow}>
                {TIME_SLOTS.map((slot) => (
                  <Pressable
                    key={slot}
                    style={[
                      styles.pickerChip,
                      selectedTimeSlot === slot && styles.pickerChipActive,
                    ]}
                    onPress={() => setSelectedTimeSlot(slot)}
                  >
                    <Text
                      style={[
                        styles.pickerChipText,
                        selectedTimeSlot === slot && styles.pickerChipTextActive,
                      ]}
                    >
                      {slot}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Match Stakes & Rules Card */}
            <Card style={styles.stakesCard}>
              <View style={styles.stakesHeaderRow}>
                <Trophy size={16} color={Tokens.colors.goldText} />
                <Text style={styles.stakesTitle}>Official Ladder Rules & Stakes</Text>
              </View>
              <View style={styles.stakesBody}>
                <Text style={styles.stakesBullet}>
                  • <Text style={styles.boldText}>Match Format:</Text> Best of 3 sets, 6-game advantage, 7-point tiebreak at 6-6.
                </Text>
                <Text style={styles.stakesBullet}>
                  • <Text style={styles.boldText}>Rung Stakes:</Text> A win advances you to Rung #{selectedDefender?.rung ?? 2}. A loss keeps your current rank.
                </Text>
                <Text style={styles.stakesBullet}>
                  • <Text style={styles.boldText}>Split Court Fee:</Text> GH₵ 60.00 / team, confirmed via MTN MoMo upon club confirmation.
                </Text>
              </View>
            </Card>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <Button
              title="Cancel"
              variant="secondary"
              size="md"
              onPress={onClose}
              style={styles.cancelBtn}
            />
            <Button
              title="Send Official Challenge"
              variant="primary"
              size="md"
              onPress={handleSubmit}
              testID="send-challenge-submit-btn"
              style={styles.submitBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Tokens.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: Tokens.spacing.md,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Tokens.spacing.lg,
    paddingBottom: Tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.colors.surfaceContainer,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  swordsIconCircle: {
    width: 32,
    height: 32,
    borderRadius: Tokens.radii.pill,
    backgroundColor: Tokens.colors.slotEmptyBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.lg,
    color: Tokens.colors.text,
  },
  closeBtn: {
    padding: Tokens.spacing.xs,
  },
  scrollArea: {
    paddingHorizontal: Tokens.spacing.lg,
  },
  scrollContent: {
    paddingVertical: Tokens.spacing.md,
    gap: Tokens.spacing.md,
  },
  roleCardChallenger: {
    backgroundColor: Tokens.colors.card,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    padding: Tokens.spacing.md,
    gap: 4,
  },
  roleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleTag: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  rungPillText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.textMuted,
  },
  roleTeamName: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    color: Tokens.colors.text,
  },
  ratingSubtext: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.textMuted,
  },
  sectionGroup: {
    gap: Tokens.spacing.xs,
  },
  labelWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionLabel: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.textMuted,
    letterSpacing: 0.5,
  },
  defendersList: {
    gap: Tokens.spacing.xs,
  },
  defenderSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Tokens.spacing.md,
    borderRadius: Tokens.radii.card,
    backgroundColor: Tokens.colors.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  defenderSelectCardActive: {
    borderColor: Tokens.colors.primary,
    backgroundColor: Tokens.colors.slotEmptyBg,
  },
  defenderCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
    flex: 1,
  },
  defenderRungBadge: {
    width: 32,
    height: 32,
    borderRadius: Tokens.radii.pill,
    backgroundColor: Tokens.colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defenderRungBadgeActive: {
    backgroundColor: Tokens.colors.primary,
  },
  defenderRungText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.text,
  },
  defenderRungTextActive: {
    color: Tokens.colors.textOnPrimary,
  },
  defenderInfoCol: {
    flex: 1,
    gap: 2,
  },
  defenderNameText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.sm,
    color: Tokens.colors.text,
  },
  defenderNameTextActive: {
    color: Tokens.colors.primary,
  },
  defenderClubText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.textMuted,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: Tokens.radii.pill,
    backgroundColor: Tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.xs,
  },
  pickerChip: {
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.pill,
    backgroundColor: Tokens.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  pickerChipActive: {
    backgroundColor: Tokens.colors.primary,
    borderColor: Tokens.colors.primary,
  },
  pickerChipText: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.text,
  },
  pickerChipTextActive: {
    color: Tokens.colors.textOnPrimary,
  },
  stakesCard: {
    padding: Tokens.spacing.md,
    backgroundColor: Tokens.colors.activeRoundBg,
    borderColor: Tokens.colors.activeRoundBorder,
    gap: Tokens.spacing.xs,
  },
  stakesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  stakesTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.activeRoundText,
    letterSpacing: 0.3,
  },
  stakesBody: {
    gap: 4,
  },
  stakesBullet: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.text,
    lineHeight: Tokens.lineHeight.sm,
  },
  boldText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
    padding: Tokens.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Tokens.colors.surfaceContainer,
  },
  cancelBtn: {
    flex: 1,
  },
  submitBtn: {
    flex: 2,
  },
});
