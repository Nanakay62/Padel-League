import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CheckCircle2, Lock, Info } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
import { Card, Button } from '@/components/ui';
import type { VenueItem } from '../hooks/useVenueFilters';
import { VenueBookingModal } from './VenueBookingModal';

export interface VenueCheckoutDrawerProps {
  selectedVenue: VenueItem;
  selectedDuration: number;
  paymentMethod: 'mtn' | 'telecel' | 'at' | 'card' | 'club';
  onSelectPaymentMethod: (method: 'mtn' | 'telecel' | 'at' | 'card' | 'club') => void;
  momoPhone: string;
  onChangeMomoPhone: (val: string) => void;
  courtFeeCedis: number;
  lightingFeeCedis: number;
  ballsFeeCedis: number;
  racketsFeeCedis: number;
  includeBalls: boolean;
  includeRackets: boolean;
  totalCedis: number;
  onCheckout: () => void;
  showBookingOpensModal: boolean;
}

export function VenueCheckoutDrawer({
  selectedVenue,
  selectedDuration,
  paymentMethod,
  onSelectPaymentMethod,
  momoPhone,
  onChangeMomoPhone,
  courtFeeCedis,
  lightingFeeCedis,
  ballsFeeCedis,
  racketsFeeCedis,
  includeBalls,
  includeRackets,
  totalCedis,
  onCheckout,
  showBookingOpensModal,
}: VenueCheckoutDrawerProps) {
  return (
    <Card style={styles.checkoutCard}>
      <View style={styles.checkoutHeader}>
        <View style={styles.checkoutTitleRow}>
          <Text style={styles.checkoutTitle}>Checkout & Payment</Text>
        </View>
      </View>

      {/* Payment Method Selector */}
      <View style={styles.paymentSection}>
        <Text style={styles.fieldLabel}>Select Payment Method</Text>
        <View style={styles.paymentMethodsCol}>
          <TouchableOpacity
            style={[styles.paymentMethodBox, paymentMethod === 'mtn' && styles.paymentMethodBoxSelected]}
            onPress={() => onSelectPaymentMethod('mtn')}
          >
            <View style={styles.paymentMethodLeft}>
              <View style={[styles.providerLogo, styles.mtnLogo]}>
                <Text style={styles.providerLogoTextMtn}>M</Text>
              </View>
              <Text style={styles.paymentMethodName}>MTN MoMo</Text>
            </View>
            <View style={styles.fastPromptBadge}>
              <View style={styles.fastPromptDot} />
              <Text style={styles.fastPromptText}>Fast Prompt</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentMethodBox, paymentMethod === 'telecel' && styles.paymentMethodBoxSelected]}
            onPress={() => onSelectPaymentMethod('telecel')}
          >
            <View style={styles.paymentMethodLeft}>
              <View style={[styles.providerLogo, styles.telecelLogo]}>
                <Text style={styles.providerLogoTextTelecel}>T</Text>
              </View>
              <Text style={styles.paymentMethodName}>Telecel Cash</Text>
            </View>
            <Text style={styles.activeText}>Active</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentMethodBox, paymentMethod === 'at' && styles.paymentMethodBoxSelected]}
            onPress={() => onSelectPaymentMethod('at')}
          >
            <View style={styles.paymentMethodLeft}>
              <View style={[styles.providerLogo, styles.atLogo]}>
                <Text style={styles.providerLogoTextAt}>AT</Text>
              </View>
              <Text style={styles.paymentMethodName}>AT Money</Text>
            </View>
            <Text style={styles.activeText}>Active</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentMethodBox, paymentMethod === 'card' && styles.paymentMethodBoxSelected]}
            onPress={() => onSelectPaymentMethod('card')}
          >
            <View style={styles.paymentMethodLeft}>
              <View style={[styles.providerLogo, styles.cardLogo]}>
                <Text style={styles.providerLogoTextCard}>CARD</Text>
              </View>
              <Text style={styles.paymentMethodName}>Credit / Debit Card</Text>
            </View>
            <Text style={styles.activeText}>Visa/MC</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentMethodBox, paymentMethod === 'club' && styles.paymentMethodBoxSelected]}
            onPress={() => onSelectPaymentMethod('club')}
          >
            <View style={styles.paymentMethodLeft}>
              <View style={[styles.providerLogo, styles.clubLogo]}>
                <Text style={styles.providerLogoTextClub}>CLUB</Text>
              </View>
              <Text style={styles.paymentMethodName}>Pay at Club</Text>
            </View>
            <Text style={styles.activeText}>Desk</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MoMo Phone Field */}
      <View style={styles.phoneSection}>
        <View style={styles.phoneLabelRow}>
          <Text style={styles.fieldLabel}>Mobile Money Number</Text>
          <Text style={styles.ghanaCodeLabel}>Ghana (+233)</Text>
        </View>
        <View style={styles.phoneInputRow}>
          <Text style={styles.phonePrefixText}>+233</Text>
          <TextInput
            value={momoPhone}
            onChangeText={onChangeMomoPhone}
            style={[styles.phoneInput, Typography.tabularNums]}
            placeholder="024 XXX XXXX"
            placeholderTextColor={Tokens.colors.textMuted}
            keyboardType="phone-pad"
          />
          <CheckCircle2 size={16} color={Tokens.colors.greenText} />
        </View>
      </View>

      {/* Price Breakdown */}
      <View style={styles.breakdownSection}>
        <Text style={styles.fieldLabel}>Reservation Breakdown</Text>
        <View style={styles.breakdownRowsCol}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Court Fee ({selectedDuration} min session)</Text>
            <Text style={[styles.breakdownVal, Typography.tabularNums]}>
              GH₵ {courtFeeCedis.toFixed(2)}
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Court Lighting & Maintenance</Text>
            <Text style={[styles.breakdownVal, Typography.tabularNums]}>
              GH₵ {lightingFeeCedis.toFixed(2)}
            </Text>
          </View>
          {includeBalls && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Head Padel Pro Can (3 Balls)</Text>
              <Text style={[styles.breakdownVal, Typography.tabularNums]}>
                GH₵ {ballsFeeCedis.toFixed(2)}
              </Text>
            </View>
          )}
          {includeRackets && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Racket Rental (x2 Babolat Pro)</Text>
              <Text style={[styles.breakdownVal, Typography.tabularNums]}>
                GH₵ {racketsFeeCedis.toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.vatSubtext}>VAT & NHIL Inclusive</Text>
          </View>
          <Text style={[styles.totalAmount, Typography.tabularNums]} testID="total-payable-amount">
            GH₵ {totalCedis.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Primary Action Button */}
      <View style={styles.checkoutActionCol}>
        <Button
          title={`Pay GH₵ ${totalCedis.toFixed(2)} via ${
            paymentMethod === 'mtn'
              ? 'MTN MoMo'
              : paymentMethod === 'telecel'
              ? 'Telecel Cash'
              : paymentMethod === 'at'
              ? 'AT Money'
              : paymentMethod === 'card'
              ? 'Card'
              : 'Pay at Club'
          }`}
          variant="primary"
          size="lg"
          icon={<Lock size={18} color={Tokens.colors.textOnPrimary} />}
          onPress={onCheckout}
        />

        <View style={styles.promptSecurityNote}>
          <Info size={16} color={Tokens.colors.textMuted} />
          <Text style={styles.promptSecurityText}>
            Slot held during reservation. Prompt will be sent to your phone for payment confirmation.
          </Text>
        </View>
      </View>

      {/* Booking Opens Soon Contact Modal */}
      <VenueBookingModal venue={selectedVenue} visible={showBookingOpensModal} />
    </Card>
  );
}

const styles = StyleSheet.create({
  checkoutCard: {
    padding: Tokens.spacing.base,
    gap: Tokens.spacing.base,
  },
  checkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.colors.border,
  },
  checkoutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  checkoutTitle: {
    ...Typography.headlineSm,
    color: Tokens.colors.text,
  },
  paymentSection: {
    gap: Tokens.spacing.sm,
  },
  fieldLabel: {
    ...Typography.labelMd,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  paymentMethodsCol: {
    gap: Tokens.spacing.sm,
  },
  paymentMethodBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Tokens.spacing.sm,
    borderRadius: Tokens.radii.card,
    backgroundColor: Tokens.colors.surface,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  paymentMethodBoxSelected: {
    borderColor: Tokens.colors.text,
    borderWidth: 2,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
  providerLogo: {
    width: 26,
    height: 26,
    borderRadius: Tokens.radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mtnLogo: {
    backgroundColor: Tokens.colors.gold,
  },
  providerLogoTextMtn: {
    fontSize: Tokens.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.text,
  },
  telecelLogo: {
    backgroundColor: Tokens.colors.danger,
  },
  providerLogoTextTelecel: {
    fontSize: Tokens.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.surface,
  },
  atLogo: {
    backgroundColor: Tokens.colors.primary,
  },
  providerLogoTextAt: {
    fontSize: Tokens.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.textOnPrimary,
  },
  cardLogo: {
    backgroundColor: Tokens.colors.textMuted,
  },
  providerLogoTextCard: {
    fontSize: Tokens.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.surface,
  },
  clubLogo: {
    backgroundColor: Tokens.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  providerLogoTextClub: {
    fontSize: Tokens.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.text,
  },
  paymentMethodName: {
    ...Typography.labelMd,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  fastPromptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fastPromptDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Tokens.colors.primary,
  },
  fastPromptText: {
    ...Typography.labelSm,
    color: Tokens.colors.greenText,
  },
  activeText: {
    ...Typography.labelSm,
    color: Tokens.colors.textMuted,
  },
  phoneSection: {
    gap: Tokens.spacing.xs,
  },
  phoneLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ghanaCodeLabel: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.card,
    backgroundColor: Tokens.colors.surface,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    gap: Tokens.spacing.xs,
  },
  phonePrefixText: {
    ...Typography.labelMd,
    color: Tokens.colors.textMuted,
  },
  phoneInput: {
    flex: 1,
    ...Typography.labelMd,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  breakdownSection: {
    gap: Tokens.spacing.sm,
    paddingTop: Tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Tokens.colors.border,
  },
  breakdownRowsCol: {
    gap: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  breakdownVal: {
    ...Typography.bodySm,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Tokens.spacing.sm,
    marginTop: Tokens.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Tokens.colors.border,
  },
  totalLabel: {
    ...Typography.headlineSm,
    color: Tokens.colors.text,
  },
  vatSubtext: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  totalAmount: {
    ...Typography.headlineLg,
    color: Tokens.colors.text,
  },
  checkoutActionCol: {
    gap: Tokens.spacing.sm,
  },
  promptSecurityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Tokens.spacing.xs,
    padding: Tokens.spacing.sm,
    borderRadius: Tokens.radii.sm,
    backgroundColor: Tokens.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  promptSecurityText: {
    flex: 1,
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
    lineHeight: Tokens.lineHeight.sm,
  },
});
