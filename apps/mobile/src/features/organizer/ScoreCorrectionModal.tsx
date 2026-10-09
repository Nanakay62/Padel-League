import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Tokens } from '@/constants/theme';

interface ScoreCorrectionModalProps {
  visible: boolean;
  matchId: string;
  courtNumber: number;
  teamA: string;
  teamB: string;
  pointTarget: number;
  initialScoreA?: number;
  initialScoreB?: number;
  onClose: () => void;
  onConfirmCorrection: (
    scoreA: number,
    scoreB: number,
    reason: string
  ) => Promise<void>;
}

export function ScoreCorrectionModal({
  visible,
  matchId: _matchId,
  courtNumber,
  teamA,
  teamB,
  pointTarget,
  initialScoreA = 0,
  initialScoreB = 0,
  onClose,
  onConfirmCorrection,
}: ScoreCorrectionModalProps) {
  const [scoreA, setScoreA] = useState(String(initialScoreA));
  const [scoreB, setScoreB] = useState(String(initialScoreB));
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const parsedA = parseInt(scoreA, 10);
    const parsedB = parseInt(scoreB, 10);

    if (isNaN(parsedA) || isNaN(parsedB) || parsedA < 0 || parsedB < 0) {
      setError('Please enter valid non-negative scores.');
      return;
    }

    if (parsedA + parsedB !== pointTarget) {
      setError(`Scores must add up exactly to target (${pointTarget}). Current sum: ${parsedA + parsedB}`);
      return;
    }

    if (!reason.trim()) {
      setError('A mandatory reason is required for score corrections (written to audit log).');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirmCorrection(parsedA, parsedB, reason.trim());
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to correct score');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Correct Match Score</Text>
          <Text style={styles.subtitle}>
            Court {courtNumber}: {teamA} vs {teamB} (Target: {pointTarget} pts)
          </Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.scoreRow}>
            <View style={styles.scoreInputContainer}>
              <Text style={styles.scoreLabel}>{teamA}</Text>
              <TextInput
                style={styles.scoreInput}
                keyboardType="numeric"
                value={scoreA}
                onChangeText={setScoreA}
                placeholder="0"
                placeholderTextColor={Tokens.colors.textMuted}
              />
            </View>

            <Text style={styles.vsText}>-</Text>

            <View style={styles.scoreInputContainer}>
              <Text style={styles.scoreLabel}>{teamB}</Text>
              <TextInput
                style={styles.scoreInput}
                keyboardType="numeric"
                value={scoreB}
                onChangeText={setScoreB}
                placeholder="0"
                placeholderTextColor={Tokens.colors.textMuted}
              />
            </View>
          </View>

          <Text style={styles.label}>Correction Reason (Required for Audit Log)*</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={reason}
            onChangeText={setReason}
            placeholder="e.g. Scores inverted on paper scoresheet, verified with both pairs"
            placeholderTextColor={Tokens.colors.textMuted}
            multiline
            numberOfLines={3}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Audit and Save"
            >
              {isSubmitting ? (
                <ActivityIndicator color={Tokens.colors.primaryForeground} />
              ) : (
                <Text style={styles.confirmButtonText}>Audit & Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 24, 26, 0.4)',
    justifyContent: 'center',
    padding: Tokens.spacing.md,
  },
  modalContent: {
    backgroundColor: Tokens.colors.surface,
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.lg,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
  },
  title: {
    fontSize: Tokens.fontSize.lg,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.text,
    marginBottom: Tokens.spacing.xs,
  },
  subtitle: {
    fontSize: Tokens.fontSize.sm,
    color: Tokens.colors.textMuted,
    marginBottom: Tokens.spacing.md,
  },
  errorText: {
    color: Tokens.colors.errorText,
    fontSize: Tokens.fontSize.sm,
    marginBottom: Tokens.spacing.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Tokens.spacing.md,
  },
  scoreInputContainer: {
    flex: 1,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: Tokens.fontSize.xs,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.text,
    marginBottom: Tokens.spacing.xs,
    textAlign: 'center',
  },
  scoreInput: {
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
    borderRadius: Tokens.radii.sm,
    paddingVertical: Tokens.spacing.xs,
    paddingHorizontal: Tokens.spacing.md,
    fontSize: Tokens.fontSize.xl,
    fontWeight: Tokens.fontWeight.semibold,
    textAlign: 'center',
    width: '80%',
    color: Tokens.colors.text,
    backgroundColor: Tokens.colors.surface,
    fontVariant: ['tabular-nums'],
  },
  vsText: {
    fontSize: Tokens.fontSize.xl,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.textMuted,
    marginHorizontal: Tokens.spacing.xs,
    marginTop: Tokens.spacing.md,
  },
  label: {
    fontSize: Tokens.fontSize.xs,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.text,
    marginBottom: Tokens.spacing.xs,
  },
  input: {
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
    borderRadius: Tokens.radii.sm,
    padding: Tokens.spacing.sm,
    fontSize: Tokens.fontSize.sm,
    marginBottom: Tokens.spacing.md,
    color: Tokens.colors.text,
    backgroundColor: Tokens.colors.surface,
  },
  textArea: {
    height: 72,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Tokens.spacing.sm,
    marginTop: Tokens.spacing.xs,
  },
  button: {
    flex: 1,
    minHeight: Tokens.dimensions.minTouchTarget,
    paddingVertical: Tokens.spacing.sm,
    borderRadius: Tokens.radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Tokens.colors.surfaceMuted,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
  },
  cancelButtonText: {
    color: Tokens.colors.text,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
  },
  confirmButton: {
    backgroundColor: Tokens.colors.primary,
  },
  confirmButtonText: {
    color: Tokens.colors.primaryForeground,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
  },
});
