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

interface OrganizerMarkPaidModalProps {
  visible: boolean;
  playerName: string;
  amountFormatted: string;
  onClose: () => void;
  onConfirmPaid: (reference: string, note?: string) => Promise<void>;
}

export function OrganizerMarkPaidModal({
  visible,
  playerName,
  amountFormatted,
  onClose,
  onConfirmPaid,
}: OrganizerMarkPaidModalProps) {
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reference.trim()) {
      setError('Please enter payment reference or receipt code.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirmPaid(reference.trim(), note.trim() || undefined);
      setReference('');
      setNote('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to confirm payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Mark Payment Confirmed</Text>
          <Text style={styles.subtitle}>
            Confirm receipt of <Text style={styles.bold}>{amountFormatted}</Text> from{' '}
            <Text style={styles.bold}>{playerName}</Text>.
          </Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Text style={styles.label}>Reference / Transaction Code *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. CASH-RECEPTION or MoMo ID"
            placeholderTextColor={Tokens.colors.textMuted}
            value={reference}
            onChangeText={setReference}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Optional Note</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Paid at desk to Coach Kojo"
            placeholderTextColor={Tokens.colors.textMuted}
            value={note}
            onChangeText={setNote}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleSubmit}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Confirm Paid"
            >
              {isSubmitting ? (
                <ActivityIndicator color={Tokens.colors.primaryForeground} size="small" />
              ) : (
                <Text style={styles.confirmText}>Confirm Paid</Text>
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Tokens.colors.surface,
    borderTopLeftRadius: Tokens.radii.card,
    borderTopRightRadius: Tokens.radii.card,
    padding: Tokens.spacing.lg,
    borderTopWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
  },
  title: {
    color: Tokens.colors.text,
    fontSize: Tokens.fontSize.lg,
    fontWeight: Tokens.fontWeight.semibold,
    marginBottom: Tokens.spacing.xs,
  },
  subtitle: {
    color: Tokens.colors.textMuted,
    fontSize: Tokens.fontSize.sm,
    marginBottom: Tokens.spacing.md,
    lineHeight: 20,
  },
  bold: {
    color: Tokens.colors.text,
    fontWeight: Tokens.fontWeight.semibold,
  },
  label: {
    color: Tokens.colors.text,
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.semibold,
    marginBottom: Tokens.spacing.xs,
  },
  input: {
    backgroundColor: Tokens.colors.surface,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
    borderRadius: Tokens.radii.sm,
    color: Tokens.colors.text,
    padding: Tokens.spacing.sm,
    fontSize: Tokens.fontSize.base,
    marginBottom: Tokens.spacing.md,
  },
  errorText: {
    color: Tokens.colors.errorText,
    fontSize: Tokens.fontSize.sm,
    marginBottom: Tokens.spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Tokens.spacing.sm,
    marginTop: Tokens.spacing.xs,
  },
  cancelButton: {
    flex: 1,
    minHeight: Tokens.dimensions.minTouchTarget,
    paddingVertical: Tokens.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Tokens.radii.button,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
  },
  cancelText: {
    color: Tokens.colors.text,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
  },
  confirmButton: {
    flex: 2,
    backgroundColor: Tokens.colors.primary,
    minHeight: Tokens.dimensions.minTouchTarget,
    paddingVertical: Tokens.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Tokens.radii.button,
  },
  confirmText: {
    color: Tokens.colors.primaryForeground,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
  },
});
