import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PadelBrand } from '@/constants/theme';
import { FeedbackDialog, useFeedbackDialog } from '@/components/ui/FeedbackDialog';

interface EventOrganizerActionsProps {
  eventId: string;
  onDuplicate: () => Promise<void>;
  onExportCsv: (type: 'registrations' | 'results' | 'settlement') => Promise<void>;
  onCancelEvent: (reason: string) => Promise<void>;
}

export function EventOrganizerActions({
  eventId: _eventId,
  onDuplicate,
  onExportCsv,
  onCancelEvent,
}: EventOrganizerActionsProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const { showDialog, dialogProps } = useFeedbackDialog();

  const handleDuplicate = async () => {
    setLoadingAction('duplicate');
    try {
      await onDuplicate();
      showDialog({
        title: 'Success',
        message: "Cloned last week's event for next week in DRAFT status.",
      });
    } catch (err: unknown) {
      showDialog({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to duplicate event',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExport = async (type: 'registrations' | 'results' | 'settlement') => {
    setLoadingAction(`export-${type}`);
    try {
      await onExportCsv(type);
    } catch (err: unknown) {
      showDialog({
        title: 'Export Failed',
        message: err instanceof Error ? err.message : 'Failed to export CSV',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePromptCancel = () => {
    showDialog({
      title: 'Cancel Event',
      message:
        'Please enter a reason for cancelling this event. Confirmed players will be refunded with platform credits.',
      prompt: {
        placeholder: 'Reason for cancellation...',
      },
      buttons: [
        { text: 'Back', style: 'cancel' },
        {
          text: 'Confirm Cancel',
          style: 'destructive',
          onPress: async (reason?: string) => {
            if (!reason || !reason.trim()) {
              showDialog({
                title: 'Error',
                message: 'Cancellation reason is required.',
              });
              return;
            }
            setLoadingAction('cancel');
            try {
              await onCancelEvent(reason.trim());
              showDialog({
                title: 'Cancelled',
                message: 'Event has been cancelled and credits issued.',
              });
            } catch (e: unknown) {
              showDialog({
                title: 'Error',
                message: e instanceof Error ? e.message : 'Cancellation failed',
              });
            } finally {
              setLoadingAction(null);
            }
          },
        },
      ],
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>Organiser Controls</Text>

      {/* Duplicate Event */}
      <TouchableOpacity
        style={[styles.primaryButton, loadingAction === 'duplicate' && styles.disabledButton]}
        onPress={handleDuplicate}
        disabled={loadingAction !== null}
      >
        {loadingAction === 'duplicate' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>🔁 Duplicate For Next Week</Text>
        )}
      </TouchableOpacity>

      {/* CSV Export Row */}
      <Text style={styles.subHeader}>Export Data (RFC-4180 CSV)</Text>
      <View style={styles.exportGrid}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => handleExport('registrations')}
          disabled={loadingAction !== null}
        >
          <Text style={styles.secondaryButtonText}>📥 Registrations</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => handleExport('results')}
          disabled={loadingAction !== null}
        >
          <Text style={styles.secondaryButtonText}>📊 Results</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => handleExport('settlement')}
          disabled={loadingAction !== null}
        >
          <Text style={styles.secondaryButtonText}>💰 Settlement</Text>
        </TouchableOpacity>
      </View>

      {/* Cancel Event */}
      <TouchableOpacity
        style={[styles.dangerButton, loadingAction === 'cancel' && styles.disabledButton]}
        onPress={handlePromptCancel}
        disabled={loadingAction !== null}
      >
        {loadingAction === 'cancel' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.dangerButtonText}>⚠️ Cancel Event (Auto-Credit All)</Text>
        )}
      </TouchableOpacity>
      <FeedbackDialog {...dialogProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  subHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 14,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: PadelBrand.electricGreen,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  exportGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 12,
  },
  dangerButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  dangerButtonText: {
    color: '#DC2626',
    fontWeight: 'bold',
    fontSize: 13,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
