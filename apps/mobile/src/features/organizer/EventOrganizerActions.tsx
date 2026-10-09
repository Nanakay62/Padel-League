import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart2, Copy, Download, Receipt, TriangleAlert } from 'lucide-react-native';
import { Tokens } from '@/constants/theme';
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
        accessibilityRole="button"
        accessibilityLabel="Duplicate For Next Week"
      >
        {loadingAction === 'duplicate' ? (
          <ActivityIndicator color={Tokens.colors.primaryForeground} />
        ) : (
          <View style={styles.buttonInnerRow}>
            <Copy size={16} color={Tokens.colors.primaryForeground} />
            <Text style={styles.primaryButtonText}>Duplicate For Next Week</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* CSV Export Row */}
      <Text style={styles.subHeader}>Export Data (RFC-4180 CSV)</Text>
      <View style={styles.exportGrid}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => handleExport('registrations')}
          disabled={loadingAction !== null}
          accessibilityRole="button"
          accessibilityLabel="Export Registrations CSV"
        >
          <View style={styles.buttonInnerRow}>
            <Download size={14} color={Tokens.colors.text} />
            <Text style={styles.secondaryButtonText}>Registrations</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => handleExport('results')}
          disabled={loadingAction !== null}
          accessibilityRole="button"
          accessibilityLabel="Export Results CSV"
        >
          <View style={styles.buttonInnerRow}>
            <BarChart2 size={14} color={Tokens.colors.text} />
            <Text style={styles.secondaryButtonText}>Results</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => handleExport('settlement')}
          disabled={loadingAction !== null}
          accessibilityRole="button"
          accessibilityLabel="Export Settlement CSV"
        >
          <View style={styles.buttonInnerRow}>
            <Receipt size={14} color={Tokens.colors.text} />
            <Text style={styles.secondaryButtonText}>Settlement</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Cancel Event */}
      <TouchableOpacity
        style={[styles.dangerButton, loadingAction === 'cancel' && styles.disabledButton]}
        onPress={handlePromptCancel}
        disabled={loadingAction !== null}
        accessibilityRole="button"
        accessibilityLabel="Cancel Event and Auto-Credit All"
      >
        {loadingAction === 'cancel' ? (
          <ActivityIndicator color={Tokens.colors.errorText} />
        ) : (
          <View style={styles.buttonInnerRow}>
            <TriangleAlert size={16} color={Tokens.colors.errorText} />
            <Text style={styles.dangerButtonText}>Cancel Event (Auto-Credit All)</Text>
          </View>
        )}
      </TouchableOpacity>
      <FeedbackDialog {...dialogProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Tokens.colors.surface,
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.md,
    marginVertical: Tokens.spacing.sm,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
  },
  sectionHeader: {
    fontSize: Tokens.fontSize.base,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.text,
    marginBottom: Tokens.spacing.sm,
  },
  subHeader: {
    fontSize: Tokens.fontSize.xs,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.textMuted,
    marginTop: Tokens.spacing.md,
    marginBottom: Tokens.spacing.xs,
  },
  primaryButton: {
    backgroundColor: Tokens.colors.primary,
    minHeight: Tokens.dimensions.minTouchTarget,
    paddingVertical: Tokens.spacing.sm,
    borderRadius: Tokens.radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  primaryButtonText: {
    color: Tokens.colors.primaryForeground,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.sm,
  },
  exportGrid: {
    flexDirection: 'row',
    gap: Tokens.spacing.xs,
    marginBottom: Tokens.spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Tokens.colors.surfaceMuted,
    minHeight: Tokens.dimensions.minTouchTarget,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
  },
  secondaryButtonText: {
    color: Tokens.colors.text,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
  },
  dangerButton: {
    backgroundColor: Tokens.colors.errorLight,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.errorBorder,
    minHeight: Tokens.dimensions.minTouchTarget,
    paddingVertical: Tokens.spacing.sm,
    borderRadius: Tokens.radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Tokens.spacing.xs,
  },
  dangerButtonText: {
    color: Tokens.colors.errorText,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.sm,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
