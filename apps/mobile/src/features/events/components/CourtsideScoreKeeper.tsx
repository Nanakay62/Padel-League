import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Plus, Minus, CheckCircle, Shield } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
import { Button } from '@/components/ui';
import {
  validateAmericanoScore,
  generateIdempotentResultId,
} from '../utils/courtsideUtils';

export interface CourtsideScoreKeeperProps {
  matchId: string;
  roundNumber?: number;
  courtNumber: number;
  teamANames: [string, string];
  teamBNames: [string, string];
  pointTarget?: number;
  initialScoreA?: number;
  onSubmitScore: (data: {
    matchId: string;
    scoreA: number;
    scoreB: number;
    resultId: string;
  }) => void;
  onCancel?: () => void;
}

export function CourtsideScoreKeeper({
  matchId,
  roundNumber = 1,
  courtNumber,
  teamANames,
  teamBNames,
  pointTarget = 24,
  initialScoreA,
  onSubmitScore,
  onCancel,
}: CourtsideScoreKeeperProps) {
  const [scoreA, setScoreA] = useState(
    initialScoreA !== undefined
      ? Math.max(0, Math.min(pointTarget, initialScoreA))
      : Math.floor(pointTarget / 2)
  );

  const scoreB = pointTarget - scoreA;
  const isValid = validateAmericanoScore(scoreA, scoreB, pointTarget);

  const adjustScoreA = (delta: number) => {
    setScoreA((prev) => Math.max(0, Math.min(pointTarget, prev + delta)));
  };

  const handleSubmit = () => {
    if (!isValid) return;
    const resultId = generateIdempotentResultId(matchId, roundNumber);
    onSubmitScore({
      matchId,
      scoreA,
      scoreB,
      resultId,
    });
  };

  return (
    <View style={styles.container}>
      {/* Top Banner / Court Header */}
      <View style={styles.headerRow}>
        <View style={styles.courtBadge}>
          <Text style={styles.courtBadgeText}>COURT {courtNumber}</Text>
        </View>
        <View style={styles.idempotentBadge}>
          <Shield size={12} color={Tokens.colors.lime} />
          <Text style={styles.idempotentText}>Offline-Safe • R{roundNumber}</Text>
        </View>
      </View>

      {/* Team A Stepper Section */}
      <View style={styles.teamCard}>
        <Text style={styles.teamHeaderLabel}>TEAM A</Text>
        <Text style={styles.playerNames}>
          {teamANames[0]} & {teamANames[1]}
        </Text>

        <View style={styles.stepperRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Decrease Team A Score"
            onPress={() => adjustScoreA(-1)}
            disabled={scoreA <= 0}
            testID="stepper-minus-a"
            style={({ pressed }) => [
              styles.stepperBtn,
              pressed && styles.stepperBtnPressed,
              scoreA <= 0 && styles.stepperBtnDisabled,
            ]}
          >
            <Minus size={28} color={Tokens.colors.live.text} />
          </Pressable>

          <View style={styles.scoreDisplay}>
            <Text style={[styles.bigScoreText, Typography.tabularNums]}>
              {scoreA}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Increase Team A Score"
            onPress={() => adjustScoreA(1)}
            disabled={scoreA >= pointTarget}
            testID="stepper-plus-a"
            style={({ pressed }) => [
              styles.stepperBtn,
              pressed && styles.stepperBtnPressed,
              scoreA >= pointTarget && styles.stepperBtnDisabled,
            ]}
          >
            <Plus size={28} color={Tokens.colors.live.text} />
          </Pressable>
        </View>
      </View>

      {/* Team B Stepper Section */}
      <View style={styles.teamCard}>
        <Text style={styles.teamHeaderLabel}>TEAM B</Text>
        <Text style={styles.playerNames}>
          {teamBNames[0]} & {teamBNames[1]}
        </Text>

        <View style={styles.stepperRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Decrease Team B Score"
            onPress={() => adjustScoreA(1)} // Decreasing B increases A
            disabled={scoreB <= 0}
            testID="stepper-minus-b"
            style={({ pressed }) => [
              styles.stepperBtn,
              pressed && styles.stepperBtnPressed,
              scoreB <= 0 && styles.stepperBtnDisabled,
            ]}
          >
            <Minus size={28} color={Tokens.colors.live.text} />
          </Pressable>

          <View style={styles.scoreDisplay}>
            <Text style={[styles.bigScoreText, Typography.tabularNums]}>
              {scoreB}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Increase Team B Score"
            onPress={() => adjustScoreA(-1)} // Increasing B decreases A
            disabled={scoreB >= pointTarget}
            testID="stepper-plus-b"
            style={({ pressed }) => [
              styles.stepperBtn,
              pressed && styles.stepperBtnPressed,
              scoreB >= pointTarget && styles.stepperBtnDisabled,
            ]}
          >
            <Plus size={28} color={Tokens.colors.live.text} />
          </Pressable>
        </View>
      </View>

      {/* Invariant Validation Pill */}
      <View style={styles.validationPill}>
        <CheckCircle size={16} color={Tokens.colors.lime} />
        <Text style={styles.validationText}>
          Total Points: {scoreA} + {scoreB} = {pointTarget}
        </Text>
      </View>

      {/* Submit Action */}
      <View style={styles.actionsRow}>
        {onCancel ? (
          <Button
            title="Cancel"
            variant="ghost"
            onPress={onCancel}
            style={styles.cancelBtn}
          />
        ) : null}
        <Button
          title="Submit Score"
          variant="primary"
          onPress={handleSubmit}
          testID="courtside-submit-score-btn"
          style={styles.submitBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Tokens.colors.live.background,
    borderRadius: Tokens.radii.cardLg,
    padding: Tokens.spacing.lg,
    gap: Tokens.spacing.base,
    borderWidth: 1,
    borderColor: Tokens.colors.live.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Tokens.spacing.xs,
  },
  courtBadge: {
    backgroundColor: Tokens.colors.live.card,
    paddingHorizontal: Tokens.spacing.md,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.xs,
    borderWidth: 1,
    borderColor: Tokens.colors.live.border,
  },
  courtBadgeText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.lime,
    letterSpacing: 1.0,
  },
  idempotentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    backgroundColor: Tokens.colors.inkSoft,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: Tokens.radii.pill,
  },
  idempotentText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Tokens.fontSize.xxs,
    color: Tokens.colors.onInkMuted,
  },
  teamCard: {
    backgroundColor: Tokens.colors.live.card,
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.base,
    borderWidth: 1,
    borderColor: Tokens.colors.live.border,
    gap: Tokens.spacing.xs,
  },
  teamHeaderLabel: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.live.textMuted,
    letterSpacing: 1.0,
  },
  playerNames: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    color: Tokens.colors.live.text,
    marginBottom: Tokens.spacing.xs,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperBtn: {
    width: 72,
    height: Tokens.touch.minStepper,
    backgroundColor: Tokens.colors.live.background,
    borderRadius: Tokens.radii.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Tokens.colors.live.border,
  },
  stepperBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  stepperBtnDisabled: {
    opacity: 0.35,
  },
  scoreDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  bigScoreText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: Tokens.fontSize.displayLg,
    lineHeight: Tokens.lineHeight.displayLg,
    fontWeight: Tokens.fontWeight.bold,
    color: Tokens.colors.live.text,
  },
  validationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Tokens.spacing.xs,
    backgroundColor: Tokens.colors.inkSoft,
    paddingVertical: Tokens.spacing.sm,
    borderRadius: Tokens.radii.pill,
  },
  validationText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.onInk,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Tokens.spacing.sm,
    marginTop: Tokens.spacing.xs,
  },
  cancelBtn: {
    flex: 1,
  },
  submitBtn: {
    flex: 2,
  },
});
