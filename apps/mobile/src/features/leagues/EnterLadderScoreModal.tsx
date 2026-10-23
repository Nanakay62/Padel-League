import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { X, Trophy, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
import { Button } from '@/components/ui';

export interface UpcomingChallengeData {
  id: string;
  opponent_name: string;
  opponent_rung: number;
  scheduled_time: string;
  venue: string;
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED';
}

export interface EnterLadderScoreModalProps {
  visible: boolean;
  onClose: () => void;
  challenge: UpcomingChallengeData;
  challengerName?: string;
  challengerRung?: number;
  onSubmitScores: (payload: {
    resultId: string;
    challengeId: string;
    setScores: { team1: number; team2: number }[];
    winnerTeam: 'challenger' | 'defender';
  }) => void;
}

export function EnterLadderScoreModal({
  visible,
  onClose,
  challenge,
  challengerName = 'Kwame A. & Partner',
  challengerRung = 4,
  onSubmitScores,
}: EnterLadderScoreModalProps) {
  // Set 1, Set 2, and optional Set 3
  const [s1c, setS1c] = useState('6');
  const [s1d, setS1d] = useState('4');
  const [s2c, setS2c] = useState('4');
  const [s2d, setS2d] = useState('6');
  const [s3c, setS3c] = useState('7');
  const [s3d, setS3d] = useState('5');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const set1 = { team1: parseInt(s1c, 10) || 0, team2: parseInt(s1d, 10) || 0 };
    const set2 = { team1: parseInt(s2c, 10) || 0, team2: parseInt(s2d, 10) || 0 };
    const set3 = { team1: parseInt(s3c, 10) || 0, team2: parseInt(s3d, 10) || 0 };

    let cSets = 0;
    let dSets = 0;

    if (set1.team1 > set1.team2) cSets++;
    else if (set1.team2 > set1.team1) dSets++;

    if (set2.team1 > set2.team2) cSets++;
    else if (set2.team2 > set2.team1) dSets++;

    if (s3c && s3d && (set3.team1 > 0 || set3.team2 > 0)) {
      if (set3.team1 > set3.team2) cSets++;
      else if (set3.team2 > set3.team1) dSets++;
    }

    if (cSets === dSets) {
      setError('Matches cannot end in a draw. Please verify set scores.');
      return;
    }

    setError(null);
    const resultId = `ladder_res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const winnerTeam = cSets > dSets ? 'challenger' : 'defender';

    onSubmitScores({
      resultId,
      challengeId: challenge.id,
      setScores: [set1, set2, set3],
      winnerTeam,
    });
    onClose();
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
              <View style={styles.iconCircle}>
                <Trophy size={18} color={Tokens.colors.primary} strokeWidth={2} />
              </View>
              <Text style={styles.headerTitle}>Enter Challenge Match Score</Text>
            </View>
            <Pressable
              testID="score-modal-close-btn"
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
            {/* Match Overview Banner */}
            <View style={styles.matchCard}>
              <View style={styles.matchTeamsRow}>
                <View style={styles.teamCol}>
                  <Text style={styles.teamRole}>CHALLENGER (Rung {challengerRung})</Text>
                  <Text style={styles.teamName}>{challengerName}</Text>
                </View>
                <View style={styles.vsBadge}>
                  <Text style={styles.vsText}>VS</Text>
                </View>
                <View style={[styles.teamCol, { alignItems: 'flex-end' }]}>
                  <Text style={styles.teamRole}>DEFENDER (Rung {challenge.opponent_rung})</Text>
                  <Text style={styles.teamName}>{challenge.opponent_name}</Text>
                </View>
              </View>
              <View style={styles.matchMetaRow}>
                <Text style={styles.metaText}>{challenge.venue} • {challenge.scheduled_time}</Text>
              </View>
            </View>

            {/* Set Scores Entry */}
            <Text style={styles.sectionLabel}>MATCH SCORES (BEST OF 3 SETS)</Text>

            <View style={styles.scoreHeadersRow}>
              <Text style={[styles.scoreColHeader, styles.scoreSetLabel]}>Set</Text>
              <View style={styles.scoreColsRight}>
                <Text style={[styles.scoreColHeader, styles.scoreColTeam]} numberOfLines={1}>
                  {challengerName.split('&')[0].trim()}
                </Text>
                <View style={styles.dashSpacer} />
                <Text style={[styles.scoreColHeader, styles.scoreColTeam]} numberOfLines={1}>
                  {challenge.opponent_name.split('&')[0].trim()}
                </Text>
              </View>
            </View>

            {/* Set 1 */}
            <View style={styles.setRow}>
              <Text style={styles.setNumberLabel}>Set 1</Text>
              <View style={styles.inputsRowRight}>
                <TextInput
                  style={styles.scoreInput}
                  keyboardType="numeric"
                  value={s1c}
                  onChangeText={setS1c}
                  maxLength={2}
                  placeholder="0"
                  placeholderTextColor={Tokens.colors.textMuted}
                />
                <Text style={styles.scoreDash}>-</Text>
                <TextInput
                  style={styles.scoreInput}
                  keyboardType="numeric"
                  value={s1d}
                  onChangeText={setS1d}
                  maxLength={2}
                  placeholder="0"
                  placeholderTextColor={Tokens.colors.textMuted}
                />
              </View>
            </View>

            {/* Set 2 */}
            <View style={styles.setRow}>
              <Text style={styles.setNumberLabel}>Set 2</Text>
              <View style={styles.inputsRowRight}>
                <TextInput
                  style={styles.scoreInput}
                  keyboardType="numeric"
                  value={s2c}
                  onChangeText={setS2c}
                  maxLength={2}
                  placeholder="0"
                  placeholderTextColor={Tokens.colors.textMuted}
                />
                <Text style={styles.scoreDash}>-</Text>
                <TextInput
                  style={styles.scoreInput}
                  keyboardType="numeric"
                  value={s2d}
                  onChangeText={setS2d}
                  maxLength={2}
                  placeholder="0"
                  placeholderTextColor={Tokens.colors.textMuted}
                />
              </View>
            </View>

            {/* Set 3 */}
            <View style={styles.setRow}>
              <Text style={styles.setNumberLabel}>Set 3</Text>
              <View style={styles.inputsRowRight}>
                <TextInput
                  style={styles.scoreInput}
                  keyboardType="numeric"
                  value={s3c}
                  onChangeText={setS3c}
                  maxLength={2}
                  placeholder="0"
                  placeholderTextColor={Tokens.colors.textMuted}
                />
                <Text style={styles.scoreDash}>-</Text>
                <TextInput
                  style={styles.scoreInput}
                  keyboardType="numeric"
                  value={s3d}
                  onChangeText={setS3d}
                  maxLength={2}
                  placeholder="0"
                  placeholderTextColor={Tokens.colors.textMuted}
                />
              </View>
            </View>

            {error && (
              <View style={styles.errorBanner}>
                <AlertCircle size={16} color={Tokens.colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Rung Swap Rule Notice */}
            <View style={styles.swapNotice}>
              <CheckCircle2 size={16} color={Tokens.colors.primary} />
              <Text style={styles.swapNoticeText}>
                If challenger wins: Challenger jumps to Rung #{challenge.opponent_rung}, Defender moves down 1 rung.
              </Text>
            </View>
          </ScrollView>

          {/* Footer Action */}
          <View style={styles.footer}>
            <Button
              title="Submit Verified Result"
              variant="primary"
              onPress={handleSubmit}
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Tokens.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.colors.border,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 92, 179, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Tokens.fontSize.base,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.text,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
  },
  scrollArea: {
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  matchCard: {
    backgroundColor: Tokens.colors.surfaceElevated,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  matchTeamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamCol: {
    flex: 1,
  },
  teamRole: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Tokens.fontSize.xxs,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  teamName: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.text,
  },
  vsBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(30, 92, 179, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  vsText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Tokens.fontSize.xs,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.primary,
  },
  matchMetaRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Tokens.colors.border,
  },
  metaText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.textMuted,
  },
  sectionLabel: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Tokens.fontSize.xs,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: Tokens.spacing.md,
  },
  scoreHeadersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  scoreColHeader: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Tokens.fontSize.xs,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.textMuted,
  },
  scoreSetLabel: {
    width: 50,
  },
  scoreColsRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashSpacer: {
    width: 24,
  },
  scoreColTeam: {
    width: 64,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Tokens.colors.surfaceElevated,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  setNumberLabel: {
    fontFamily: Typography.fontFamily.semibold,
    width: 50,
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.text,
  },
  inputsRowRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreInput: {
    width: 64,
    height: 42,
    backgroundColor: Tokens.colors.surface,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    borderRadius: Tokens.radii.input,
    textAlign: 'center',
    fontSize: Tokens.fontSize.lg,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.text,
    paddingVertical: 0,
  },
  scoreDash: {
    width: 24,
    textAlign: 'center',
    fontSize: Tokens.fontSize.lg,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.textMuted,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  errorText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.danger,
    fontWeight: Tokens.fontWeight.medium,
  },
  swapNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(30, 92, 179, 0.08)',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },
  swapNoticeText: {
    fontFamily: Typography.fontFamily.regular,
    flex: 1,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.text,
    lineHeight: 17,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  submitBtn: {
    width: '100%',
  },
});
