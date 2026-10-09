import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';

interface ScoreStepperProps {
  teamANames: [string, string];
  teamBNames: [string, string];
  pointTarget: number;
  initialScoreA?: number;
  onSubmit: (scoreA: number, scoreB: number) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export function ScoreStepper({
  teamANames,
  teamBNames,
  pointTarget = 24,
  initialScoreA = 12,
  onSubmit,
  onCancel,
  disabled = false,
}: ScoreStepperProps) {
  const [scoreA, setScoreA] = useState(
    Math.max(0, Math.min(pointTarget, initialScoreA))
  );
  const [confirming, setConfirming] = useState(false);

  const scoreB = pointTarget - scoreA;

  const adjustScoreA = (delta: number) => {
    setScoreA((prev) => Math.max(0, Math.min(pointTarget, prev + delta)));
  };

  const handleConfirmSubmit = () => {
    onSubmit(scoreA, scoreB);
  };

  if (confirming) {
    return (
      <View style={styles.confirmContainer}>
        <Text style={styles.confirmTitle}>Confirm Score</Text>
        <Text style={styles.confirmSub}>
          Scores must add up to {pointTarget}
        </Text>

        <View style={styles.confirmScoreBoard}>
          <View style={styles.confirmTeamColumn}>
            <Text style={styles.confirmTeamNames}>
              {teamANames[0]} & {teamANames[1]}
            </Text>
            <Text style={[styles.confirmBigScore, Typography.tabularNums]}>{scoreA}</Text>
          </View>

          <Text style={styles.confirmDivider}>-</Text>

          <View style={styles.confirmTeamColumn}>
            <Text style={styles.confirmTeamNames}>
              {teamBNames[0]} & {teamBNames[1]}
            </Text>
            <Text style={[styles.confirmBigScore, Typography.tabularNums]}>{scoreB}</Text>
          </View>
        </View>

        <View style={styles.confirmActions}>
          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
            onPress={() => setConfirming(false)}
          >
            <Text style={styles.btnSecondaryText}>Edit Score</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={handleConfirmSubmit}
            disabled={disabled}
          >
            <Text style={styles.btnPrimaryText}>Submit Score</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Team A Counter */}
      <View style={styles.teamCard}>
        <View style={styles.teamHeader}>
          <Text style={styles.teamLabel}>TEAM A</Text>
          <Text style={styles.playerNames} numberOfLines={1}>
            {teamANames[0]} • {teamANames[1]}
          </Text>
        </View>

        <View style={styles.stepperRow}>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => adjustScoreA(-1)}
            disabled={disabled || scoreA <= 0}
            accessibilityLabel="Decrease Team A score"
          >
            <Minus size={24} color={Tokens.colors.live.text} strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.scoreDisplay}>
            <Text style={[styles.scoreText, Typography.tabularNums]}>{scoreA}</Text>
            <Text style={styles.targetLabel}>pts</Text>
          </View>

          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => adjustScoreA(1)}
            disabled={disabled || scoreA >= pointTarget}
            accessibilityLabel="Increase Team A score"
          >
            <Plus size={24} color={Tokens.colors.live.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Target indicator */}
      <View style={styles.targetBadge}>
        <Text style={[styles.targetBadgeText, Typography.tabularNums]}>
          Total: {scoreA + scoreB} / {pointTarget} pts
        </Text>
      </View>

      {/* Team B Counter */}
      <View style={styles.teamCard}>
        <View style={styles.teamHeader}>
          <Text style={styles.teamLabel}>TEAM B</Text>
          <Text style={styles.playerNames} numberOfLines={1}>
            {teamBNames[0]} • {teamBNames[1]}
          </Text>
        </View>

        <View style={styles.stepperRow}>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => adjustScoreA(1)}
            disabled={disabled || scoreB <= 0}
            accessibilityLabel="Decrease Team B score"
          >
            <Minus size={24} color={Tokens.colors.live.text} strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.scoreDisplay}>
            <Text style={[styles.scoreText, Typography.tabularNums]}>{scoreB}</Text>
            <Text style={styles.targetLabel}>pts</Text>
          </View>

          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => adjustScoreA(-1)}
            disabled={disabled || scoreB >= pointTarget}
            accessibilityLabel="Increase Team B score"
          >
            <Plus size={24} color={Tokens.colors.live.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.bottomActions}>
        {onCancel && (
          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
            onPress={onCancel}
          >
            <Text style={styles.btnSecondaryText}>Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary, { flex: onCancel ? 1 : undefined }]}
          onPress={() => setConfirming(true)}
          disabled={disabled}
        >
          <Text style={styles.btnPrimaryText}>Review & Enter Score</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Tokens.spacing.base,
    backgroundColor: Tokens.colors.live.background,
    borderRadius: Tokens.radii.card,
  },
  teamCard: {
    backgroundColor: Tokens.colors.live.card,
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.base,
    borderWidth: 1,
    borderColor: Tokens.colors.live.border,
  },
  teamHeader: {
    marginBottom: Tokens.spacing.md,
  },
  teamLabel: {
    color: Tokens.colors.primary,
    fontSize: Tokens.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    letterSpacing: 1.5,
  },
  playerNames: {
    color: Tokens.colors.live.text,
    fontSize: Tokens.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    marginTop: 2,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBtn: {
    width: 72,
    height: Tokens.touch.minStepper,
    backgroundColor: Tokens.colors.live.card,
    borderRadius: Tokens.radii.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Tokens.colors.live.border,
  },
  scoreDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  scoreText: {
    color: Tokens.colors.live.text,
    fontSize: Tokens.fontSize.display,
    lineHeight: Tokens.lineHeight.display,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  targetLabel: {
    color: Tokens.colors.live.textMuted,
    fontSize: Tokens.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    marginTop: -Tokens.spacing.xs,
  },
  targetBadge: {
    alignSelf: 'center',
    marginVertical: Tokens.spacing.md,
    paddingVertical: Tokens.spacing.xs,
    paddingHorizontal: Tokens.spacing.base,
    backgroundColor: Tokens.colors.live.card,
    borderRadius: Tokens.radii.pill,
    borderWidth: 1,
    borderColor: Tokens.colors.live.border,
  },
  targetBadgeText: {
    color: Tokens.colors.live.gold,
    fontSize: Tokens.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: Tokens.spacing.md,
    marginTop: Tokens.spacing.base,
  },
  btn: {
    minHeight: Tokens.touch.minTarget,
    borderRadius: Tokens.radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Tokens.spacing.lg,
  },
  btnPrimary: {
    backgroundColor: Tokens.colors.primary,
  },
  btnPrimaryText: {
    color: Tokens.colors.textOnPrimary,
    fontSize: Tokens.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  btnSecondary: {
    backgroundColor: Tokens.colors.live.card,
    borderWidth: 1,
    borderColor: Tokens.colors.live.border,
  },
  btnSecondaryText: {
    color: Tokens.colors.live.text,
    fontSize: Tokens.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
  },
  confirmContainer: {
    padding: Tokens.spacing.base,
    backgroundColor: Tokens.colors.live.background,
    borderRadius: Tokens.radii.card,
  },
  confirmTitle: {
    color: Tokens.colors.live.text,
    fontSize: Tokens.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    textAlign: 'center',
  },
  confirmSub: {
    color: Tokens.colors.live.textMuted,
    fontSize: Tokens.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Tokens.spacing.lg,
  },
  confirmScoreBoard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Tokens.colors.live.card,
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.lg,
    borderWidth: 1,
    borderColor: Tokens.colors.live.border,
    marginBottom: Tokens.spacing.lg,
  },
  confirmTeamColumn: {
    alignItems: 'center',
    flex: 1,
  },
  confirmTeamNames: {
    color: Tokens.colors.live.textMuted,
    fontSize: Tokens.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    textAlign: 'center',
    marginBottom: Tokens.spacing.xs,
  },
  confirmBigScore: {
    color: Tokens.colors.primary,
    fontSize: Tokens.fontSize.display,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  confirmDivider: {
    color: Tokens.colors.live.border,
    fontSize: Tokens.fontSize.xxl,
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    paddingHorizontal: Tokens.spacing.sm,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: Tokens.spacing.md,
  },
});
