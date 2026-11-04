import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Tokens, Typography } from '@/constants/theme';
import { t } from '@/lib/i18n';

export interface OtpVerificationViewProps {
  phone: string;
  otp: string;
  onOtpChange: (val: string) => void;
  otpInputRef: React.RefObject<TextInput | null>;
  secondsRemaining: number;
  formattedCountdown: string;
  resendCooldown: number;
  loading: boolean;
  onVerifyOtp: () => void;
  onResendOtp: () => void;
  onChangePhone: () => void;
}

export function OtpVerificationView({
  phone,
  otp,
  onOtpChange,
  otpInputRef,
  secondsRemaining,
  formattedCountdown,
  resendCooldown,
  loading,
  onVerifyOtp,
  onResendOtp,
  onChangePhone,
}: OtpVerificationViewProps) {
  const isVerifyDisabled = otp.length !== 6 || secondsRemaining <= 0 || loading;

  return (
    <View style={styles.formSection}>
      <Text style={styles.label}>{t('authEnterCodeLabel')}</Text>
      <Text style={styles.subtext}>{t('authCodeSentTo', { phone })}</Text>

      <TextInput
        ref={otpInputRef}
        style={styles.otpInput}
        placeholder="000000"
        placeholderTextColor={Tokens.colors.textMuted}
        keyboardType="number-pad"
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        maxLength={6}
        value={otp}
        onChangeText={onOtpChange}
        testID="otp-input"
        autoFocus
      />

      <View style={styles.timerRow}>
        {secondsRemaining > 0 ? (
          <Text style={styles.timerText}>
            Code expires in{' '}
            <Text style={styles.timerBold}>{formattedCountdown}</Text>
          </Text>
        ) : (
          <Text style={styles.expiredText}>{t('authCodeExpired')}</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, isVerifyDisabled && styles.disabledBtn]}
        onPress={onVerifyOtp}
        disabled={isVerifyDisabled}
        accessibilityRole="button"
        accessibilityLabel={t('authVerifyBtn')}
        testID="verify-code-button"
      >
        {loading ? (
          <ActivityIndicator color={Tokens.colors.primaryForeground} />
        ) : (
          <Text style={styles.primaryBtnText}>{t('authVerifyBtn')}</Text>
        )}
      </TouchableOpacity>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={onResendOtp}
          disabled={resendCooldown > 0 || loading}
          testID="resend-code-button"
        >
          <Text
            style={[
              styles.linkBtnText,
              resendCooldown > 0 && styles.linkBtnDisabled,
            ]}
          >
            {resendCooldown > 0
              ? t('authResendCooldown', { seconds: resendCooldown })
              : t('authResendCodeBtn')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkBtn}
          onPress={onChangePhone}
          testID="change-phone-button"
        >
          <Text style={styles.linkBtnText}>{t('authChangePhoneBtn')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formSection: {
    gap: Tokens.spacing.xs,
  },
  label: {
    ...Typography.labelMd,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    marginBottom: 4,
  },
  subtext: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
    marginBottom: Tokens.spacing.sm,
  },
  otpInput: {
    backgroundColor: Tokens.colors.surface,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    borderRadius: Tokens.radii.card,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.md,
    fontSize: Tokens.fontSize.xxl,
    textAlign: 'center',
    letterSpacing: 8,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.text,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: Tokens.spacing.xs,
  },
  timerText: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  timerBold: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.text,
  },
  expiredText: {
    ...Typography.bodySm,
    color: Tokens.colors.danger,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
  },
  primaryBtn: {
    backgroundColor: Tokens.colors.primary,
    borderRadius: Tokens.radii.card,
    paddingVertical: Tokens.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Tokens.spacing.sm,
    minHeight: 48,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  primaryBtnText: {
    ...Typography.headlineSm,
    color: Tokens.colors.primaryForeground,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Tokens.spacing.md,
  },
  linkBtn: {
    padding: Tokens.spacing.xs,
  },
  linkBtnText: {
    ...Typography.labelSm,
    color: Tokens.colors.primary,
  },
  linkBtnDisabled: {
    color: Tokens.colors.textMuted,
  },
});
