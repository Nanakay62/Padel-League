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

export interface PhoneAuthFormProps {
  phone: string;
  setPhone: (val: string) => void;
  name: string;
  setName: (val: string) => void;
  loading: boolean;
  onRequestOtp: () => void;
}

export function PhoneAuthForm({
  phone,
  setPhone,
  name,
  setName,
  loading,
  onRequestOtp,
}: PhoneAuthFormProps) {
  return (
    <View style={styles.formSection}>
      <Text style={styles.label}>{t('authPhoneLabel')}</Text>
      <View style={styles.phoneInputContainer}>
        <View style={styles.prefixBadge}>
          <Text style={styles.prefixText}>+233</Text>
        </View>
        <TextInput
          style={styles.phoneInput}
          placeholder={t('authPhonePlaceholder')}
          placeholderTextColor={Tokens.colors.textMuted}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          value={phone}
          onChangeText={setPhone}
          testID="phone-input"
          autoFocus
        />
      </View>

      <Text style={[styles.label, { marginTop: Tokens.spacing.md }]}>
        {t('authNameLabel')}
      </Text>
      <TextInput
        style={styles.textInput}
        placeholder={t('authNamePlaceholder')}
        placeholderTextColor={Tokens.colors.textMuted}
        autoComplete="name"
        textContentType="name"
        value={name}
        onChangeText={setName}
        testID="name-input"
      />

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={onRequestOtp}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={t('authSendCodeBtn')}
        testID="send-code-button"
      >
        {loading ? (
          <ActivityIndicator color={Tokens.colors.primaryForeground} />
        ) : (
          <Text style={styles.primaryBtnText}>{t('authSendCodeBtn')}</Text>
        )}
      </TouchableOpacity>
      <Text style={styles.disclaimerText}>{t('authDisclaimer')}</Text>
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
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Tokens.colors.surface,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    borderRadius: Tokens.radii.card,
    overflow: 'hidden',
  },
  prefixBadge: {
    backgroundColor: Tokens.colors.surfaceMuted,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.sm,
    borderRightWidth: 1,
    borderRightColor: Tokens.colors.border,
  },
  prefixText: {
    ...Typography.bodyMd,
    color: Tokens.colors.textMuted,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.sm,
    ...Typography.bodyMd,
    color: Tokens.colors.text,
  },
  textInput: {
    backgroundColor: Tokens.colors.surface,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    borderRadius: Tokens.radii.card,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.sm,
    ...Typography.bodyMd,
    color: Tokens.colors.text,
  },
  primaryBtn: {
    backgroundColor: Tokens.colors.primary,
    borderRadius: Tokens.radii.card,
    paddingVertical: Tokens.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Tokens.spacing.lg,
    minHeight: 48,
  },
  primaryBtnText: {
    ...Typography.headlineSm,
    color: Tokens.colors.primaryForeground,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  disclaimerText: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
    textAlign: 'center',
    marginTop: Tokens.spacing.sm,
  },
});
