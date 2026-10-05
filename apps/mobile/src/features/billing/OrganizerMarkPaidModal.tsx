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
import { PadelBrand, Colors } from '@/constants/theme';

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
            placeholderTextColor={Colors.dark.textSecondary}
            value={reference}
            onChangeText={setReference}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Optional Note</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Paid at desk to Coach Kojo"
            placeholderTextColor={Colors.dark.textSecondary}
            value={note}
            onChangeText={setNote}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#000" size="small" />
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: PadelBrand.cardDark,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  bold: {
    color: Colors.dark.text,
    fontWeight: '700',
  },
  label: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: PadelBrand.charcoal,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
    borderRadius: 12,
    color: Colors.dark.text,
    padding: 14,
    fontSize: 15,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
  cancelText: {
    color: Colors.dark.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  confirmButton: {
    flex: 2,
    backgroundColor: PadelBrand.electricGreen,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  confirmText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },
});
