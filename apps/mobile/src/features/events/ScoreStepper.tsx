import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PadelBrand } from '@/constants/theme';

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
            <Text style={styles.confirmBigScore}>{scoreA}</Text>
          </View>

          <Text style={styles.confirmDivider}>—</Text>

          <View style={styles.confirmTeamColumn}>
            <Text style={styles.confirmTeamNames}>
              {teamBNames[0]} & {teamBNames[1]}
            </Text>
            <Text style={styles.confirmBigScore}>{scoreB}</Text>
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
            <Text style={styles.stepBtnText}>−</Text>
          </TouchableOpacity>

          <View style={styles.scoreDisplay}>
            <Text style={styles.scoreText}>{scoreA}</Text>
            <Text style={styles.targetLabel}>pts</Text>
          </View>

          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => adjustScoreA(1)}
            disabled={disabled || scoreA >= pointTarget}
            accessibilityLabel="Increase Team A score"
          >
            <Text style={styles.stepBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Target indicator */}
      <View style={styles.targetBadge}>
        <Text style={styles.targetBadgeText}>
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
            <Text style={styles.stepBtnText}>−</Text>
          </TouchableOpacity>

          <View style={styles.scoreDisplay}>
            <Text style={styles.scoreText}>{scoreB}</Text>
            <Text style={styles.targetLabel}>pts</Text>
          </View>

          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => adjustScoreA(-1)}
            disabled={disabled || scoreB >= pointTarget}
            accessibilityLabel="Increase Team B score"
          >
            <Text style={styles.stepBtnText}>+</Text>
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
    padding: 16,
    backgroundColor: PadelBrand.charcoal,
    borderRadius: 16,
  },
  teamCard: {
    backgroundColor: PadelBrand.cardDark,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
  teamHeader: {
    marginBottom: 12,
  },
  teamLabel: {
    color: PadelBrand.electricGreen,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  playerNames: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 2,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBtn: {
    width: 72,
    height: 64,
    backgroundColor: '#232D29',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#303E38',
  },
  stepBtnText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '600',
    lineHeight: 36,
  },
  scoreDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
  },
  targetLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
    marginTop: -4,
  },
  targetBadge: {
    alignSelf: 'center',
    marginVertical: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#1B2420',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#293831',
  },
  targetBadgeText: {
    color: PadelBrand.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  btn: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  btnPrimary: {
    backgroundColor: PadelBrand.electricGreen,
  },
  btnPrimaryText: {
    color: '#0B0F0E',
    fontSize: 16,
    fontWeight: '700',
  },
  btnSecondary: {
    backgroundColor: '#232D29',
    borderWidth: 1,
    borderColor: '#303E38',
  },
  btnSecondaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmContainer: {
    padding: 24,
    backgroundColor: PadelBrand.cardDark,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
  confirmTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  confirmSub: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 20,
  },
  confirmScoreBoard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 16,
    backgroundColor: '#0E1311',
    borderRadius: 14,
    marginBottom: 24,
  },
  confirmTeamColumn: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  confirmTeamNames: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmBigScore: {
    color: PadelBrand.electricGreen,
    fontSize: 54,
    fontWeight: '800',
  },
  confirmDivider: {
    color: '#64748B',
    fontSize: 32,
    fontWeight: '600',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
});
