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
import { PadelBrand, Colors } from '@/constants/theme';
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
              <ActivityIndicator size="large" color={PadelBrand.electricGreen} />
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
              <TouchableOpacity style={styles.doneButton} onPress={onClose}>
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
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.payBtn}
                  onPress={handleStartPayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#000" size="small" />
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  content: {
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
    marginBottom: 4,
  },
  eventTitle: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    marginBottom: 16,
  },
  breakdownCard: {
    backgroundColor: PadelBrand.charcoal,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
  },
  breakdownValue: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: PadelBrand.borderDark,
    marginVertical: 8,
  },
  totalLabel: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    color: PadelBrand.electricGreen,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  methodSelector: {
    gap: 8,
    marginBottom: 20,
  },
  methodOption: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
    backgroundColor: PadelBrand.charcoal,
  },
  methodSelected: {
    borderColor: PadelBrand.electricGreen,
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
  },
  methodText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  methodTextSelected: {
    color: PadelBrand.electricGreen,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
  cancelBtnText: {
    color: Colors.dark.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  payBtn: {
    flex: 2,
    backgroundColor: PadelBrand.electricGreen,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  payBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
  waitingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  waitingTitle: {
    color: Colors.dark.text,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  waitingSubtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 12,
  },
  holdNotice: {
    color: PadelBrand.electricGreen,
    fontSize: 13,
    fontWeight: '600',
  },
  manualContainer: {
    paddingVertical: 12,
  },
  manualTitle: {
    color: PadelBrand.electricGreen,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  manualSubtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  momoDetailBox: {
    backgroundColor: PadelBrand.charcoal,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
    marginBottom: 16,
    gap: 6,
  },
  momoRow: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
  },
  momoBold: {
    color: Colors.dark.text,
    fontWeight: '700',
  },
  doneButton: {
    backgroundColor: PadelBrand.electricGreen,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  doneButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },
});
