import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Tokens } from '@/constants/theme';
import { computePricingBreakdown, formatPesewasToGHS } from './billing-utils';

interface CheckoutModalProps {
  visible: boolean;
  eventTitle: string;
  courtFeePesewas: number;
  platformFeePesewas?: number;
  organizerPhone?: string;
  organizerName?: string;
  onClose: () => void;
  onInitiatePayment: (method: 'PAYSTACK' | 'MANUAL_MOMO' | 'CASH') => Promise<{
    orderId: string;
    reference: string;
    authorizationUrl?: string;
  }>;
  onCheckOrderStatus: (orderId: string) => Promise<{ status: string }>;
  onPaymentConfirmed: () => void;
}

export function CheckoutModal({
  visible,
  eventTitle,
  courtFeePesewas,
  platformFeePesewas = 500,
  organizerPhone = '+233 24 123 4567',
  organizerName = 'Coach Kojo',
  onClose,
  onInitiatePayment,
  onCheckOrderStatus,
  onPaymentConfirmed,
}: CheckoutModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'PAYSTACK' | 'MANUAL_MOMO' | 'CASH'>(
    'PAYSTACK'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isWaitingForApproval, setIsWaitingForApproval] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [manualReference, setManualReference] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const breakdown = computePricingBreakdown(courtFeePesewas, platformFeePesewas);

  // Poll order status when waiting for MoMo phone approval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isWaitingForApproval && activeOrderId) {
      interval = setInterval(async () => {
        try {
          const res = await onCheckOrderStatus(activeOrderId);
          if (res.status === 'PAID') {
            setIsWaitingForApproval(false);
            onPaymentConfirmed();
            onClose();
          }
        } catch {
          // Keep polling silently
        }
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWaitingForApproval, activeOrderId, onCheckOrderStatus, onPaymentConfirmed, onClose]);

  const handleStartPayment = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const order = await onInitiatePayment(selectedMethod);
      setActiveOrderId(order.orderId);

      if (selectedMethod === 'PAYSTACK') {
        if (order.authorizationUrl) {
          await WebBrowser.openBrowserAsync(order.authorizationUrl);
        }
        setIsWaitingForApproval(true);
      } else {
        setManualReference(order.reference);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to initiate payment');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Confirm & Join</Text>
          <Text style={styles.eventTitle}>{eventTitle}</Text>

          {/* Transparent pricing breakdown */}
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Court Share (Confirmed)</Text>
              <Text style={styles.breakdownValue}>{breakdown.courtFeeFormatted}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Platform Fee</Text>
              <Text style={styles.breakdownValue}>{breakdown.platformFeeFormatted}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.breakdownRow}>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.totalValue}>{breakdown.totalFormatted}</Text>
            </View>
          </View>

          {isWaitingForApproval ? (
            <View style={styles.waitingContainer}>
              <ActivityIndicator size="large" color={Tokens.colors.primary} />
              <Text style={styles.waitingTitle}>Waiting for Approval on Your Phone</Text>
              <Text style={styles.waitingSubtitle}>
                Please check your phone for the Mobile Money prompt (MTN MoMo, Telecel Cash, or AT
                Money) and enter your PIN.
              </Text>
              <Text style={styles.holdNotice}>Your seat is held for 10 minutes.</Text>
            </View>
          ) : manualReference ? (
            <View style={styles.manualContainer}>
              <Text style={styles.manualTitle}>Seat Reserved for 10 Minutes</Text>
              <Text style={styles.manualSubtitle}>
                Please transfer {formatPesewasToGHS(breakdown.totalPesewas)} directly to the
                organiser or pay cash at the club reception:
              </Text>
              <View style={styles.momoDetailBox}>
                <Text style={styles.momoRow}>
                  Name: <Text style={styles.momoBold}>{organizerName}</Text>
                </Text>
                <Text style={styles.momoRow}>
                  MoMo Number: <Text style={styles.momoBold}>{organizerPhone}</Text>
                </Text>
                <Text style={styles.momoRow}>
                  Reference: <Text style={styles.momoBold}>{manualReference}</Text>
                </Text>
              </View>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Done"
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Select Payment Method</Text>
              <View style={styles.methodSelector}>
                <TouchableOpacity
                  style={[
                    styles.methodOption,
                    selectedMethod === 'PAYSTACK' && styles.methodSelected,
                  ]}
                  onPress={() => setSelectedMethod('PAYSTACK')}
                  accessibilityRole="button"
                  accessibilityLabel="MoMo or Card via Paystack"
                >
                  <Text
                    style={[
                      styles.methodText,
                      selectedMethod === 'PAYSTACK' && styles.methodTextSelected,
                    ]}
                  >
                    MoMo / Card (Paystack)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.methodOption,
                    selectedMethod === 'MANUAL_MOMO' && styles.methodSelected,
                  ]}
                  onPress={() => setSelectedMethod('MANUAL_MOMO')}
                  accessibilityRole="button"
                  accessibilityLabel="Direct MoMo to Organiser"
                >
                  <Text
                    style={[
                      styles.methodText,
                      selectedMethod === 'MANUAL_MOMO' && styles.methodTextSelected,
                    ]}
                  >
                    Direct MoMo to Organiser
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.methodOption,
                    selectedMethod === 'CASH' && styles.methodSelected,
                  ]}
                  onPress={() => setSelectedMethod('CASH')}
                  accessibilityRole="button"
                  accessibilityLabel="Cash at Club"
                >
                  <Text
                    style={[
                      styles.methodText,
                      selectedMethod === 'CASH' && styles.methodTextSelected,
                    ]}
                  >
                    Cash at Club
                  </Text>
                </TouchableOpacity>
              </View>

              {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  disabled={isProcessing}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel payment"
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.payBtn}
                  onPress={handleStartPayment}
                  disabled={isProcessing}
                  accessibilityRole="button"
                  accessibilityLabel={selectedMethod === 'PAYSTACK' ? 'Pay Now' : 'Hold Seat for 10 minutes'}
                >
                  {isProcessing ? (
                    <ActivityIndicator color={Tokens.colors.primaryForeground} size="small" />
                  ) : (
                    <Text style={styles.payBtnText}>
                      {selectedMethod === 'PAYSTACK' ? 'Pay Now' : 'Hold Seat (10m)'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
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
  content: {
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
  eventTitle: {
    color: Tokens.colors.textMuted,
    fontSize: Tokens.fontSize.sm,
    marginBottom: Tokens.spacing.md,
  },
  breakdownCard: {
    backgroundColor: Tokens.colors.surfaceMuted,
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.md,
    marginBottom: Tokens.spacing.md,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Tokens.spacing.xs,
  },
  breakdownLabel: {
    color: Tokens.colors.textMuted,
    fontSize: Tokens.fontSize.sm,
  },
  breakdownValue: {
    color: Tokens.colors.text,
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.medium,
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: Tokens.borders.width,
    backgroundColor: Tokens.colors.border,
    marginVertical: Tokens.spacing.xs,
  },
  totalLabel: {
    color: Tokens.colors.text,
    fontSize: Tokens.fontSize.base,
    fontWeight: Tokens.fontWeight.semibold,
  },
  totalValue: {
    color: Tokens.colors.primaryText,
    fontSize: Tokens.fontSize.lg,
    fontWeight: Tokens.fontWeight.semibold,
    fontVariant: ['tabular-nums'],
  },
  sectionTitle: {
    color: Tokens.colors.text,
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.semibold,
    marginBottom: Tokens.spacing.sm,
  },
  methodSelector: {
    gap: Tokens.spacing.xs,
    marginBottom: Tokens.spacing.md,
  },
  methodOption: {
    padding: Tokens.spacing.sm,
    minHeight: Tokens.dimensions.minTouchTarget,
    justifyContent: 'center',
    borderRadius: Tokens.radii.sm,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
    backgroundColor: Tokens.colors.surface,
  },
  methodSelected: {
    borderColor: Tokens.colors.primaryText,
    backgroundColor: Tokens.colors.primaryLight,
  },
  methodText: {
    color: Tokens.colors.textMuted,
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.semibold,
  },
  methodTextSelected: {
    color: Tokens.colors.primaryText,
  },
  errorText: {
    color: Tokens.colors.errorText,
    fontSize: Tokens.fontSize.sm,
    marginBottom: Tokens.spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Tokens.spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    minHeight: Tokens.dimensions.minTouchTarget,
    paddingVertical: Tokens.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Tokens.radii.button,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
  },
  cancelBtnText: {
    color: Tokens.colors.text,
    fontSize: Tokens.fontSize.base,
    fontWeight: Tokens.fontWeight.semibold,
  },
  payBtn: {
    flex: 2,
    backgroundColor: Tokens.colors.primary,
    minHeight: Tokens.dimensions.minTouchTarget,
    paddingVertical: Tokens.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Tokens.radii.button,
  },
  payBtnText: {
    color: Tokens.colors.primaryForeground,
    fontSize: Tokens.fontSize.base,
    fontWeight: Tokens.fontWeight.semibold,
  },
  waitingContainer: {
    alignItems: 'center',
    paddingVertical: Tokens.spacing.lg,
  },
  waitingTitle: {
    color: Tokens.colors.text,
    fontSize: Tokens.fontSize.base,
    fontWeight: Tokens.fontWeight.semibold,
    marginTop: Tokens.spacing.md,
    marginBottom: Tokens.spacing.xs,
    textAlign: 'center',
  },
  waitingSubtitle: {
    color: Tokens.colors.textMuted,
    fontSize: Tokens.fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: Tokens.spacing.sm,
  },
  holdNotice: {
    color: Tokens.colors.primaryText,
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.semibold,
  },
  manualContainer: {
    paddingVertical: Tokens.spacing.sm,
  },
  manualTitle: {
    color: Tokens.colors.primaryText,
    fontSize: Tokens.fontSize.base,
    fontWeight: Tokens.fontWeight.semibold,
    marginBottom: Tokens.spacing.xs,
  },
  manualSubtitle: {
    color: Tokens.colors.textMuted,
    fontSize: Tokens.fontSize.sm,
    lineHeight: 20,
    marginBottom: Tokens.spacing.sm,
  },
  momoDetailBox: {
    backgroundColor: Tokens.colors.surfaceMuted,
    borderRadius: Tokens.radii.sm,
    padding: Tokens.spacing.sm,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
    marginBottom: Tokens.spacing.md,
    gap: Tokens.spacing.xs,
  },
  momoRow: {
    color: Tokens.colors.textMuted,
    fontSize: Tokens.fontSize.sm,
  },
  momoBold: {
    color: Tokens.colors.text,
    fontWeight: Tokens.fontWeight.semibold,
  },
  doneButton: {
    backgroundColor: Tokens.colors.primary,
    minHeight: Tokens.dimensions.minTouchTarget,
    paddingVertical: Tokens.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Tokens.radii.button,
  },
  doneButtonText: {
    color: Tokens.colors.primaryForeground,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
  },
});
