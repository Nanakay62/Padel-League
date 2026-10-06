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
import { PadelBrand } from '@/constants/theme';

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
              />
            </View>
          </View>

          <Text style={styles.label}>Correction Reason (Required for Audit Log)*</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={reason}
            onChangeText={setReason}
            placeholder="e.g. Scores inverted on paper scoresheet, verified with both pairs"
            multiline
            numberOfLines={3}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scoreInputContainer: {
    flex: 1,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    textAlign: 'center',
  },
  scoreInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '80%',
    color: '#111827',
  },
  vsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#9CA3AF',
    marginHorizontal: 8,
    marginTop: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    color: '#111827',
  },
  textArea: {
    height: 72,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#4B5563',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: PadelBrand.electricGreen,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
