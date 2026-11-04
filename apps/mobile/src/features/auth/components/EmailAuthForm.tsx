import React from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
import { t } from '@/lib/i18n';

export interface EmailAuthFormProps {
  emailMode: 'SIGN_IN' | 'REGISTER' | 'RESET';
  setEmailMode: (mode: 'SIGN_IN' | 'REGISTER' | 'RESET') => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  name: string;
  setName: (val: string) => void;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
  resetSent: boolean;
  setResetSent: (val: boolean) => void;
  registerSuccessMsg: string | null;
  onEmailSubmit: () => void;
  onClearError: () => void;
}

export function EmailAuthForm({
  emailMode,
  setEmailMode,
  email,
  setEmail,
  password,
  setPassword,
  name,
  setName,
  showPassword,
  setShowPassword,
  loading,
  resetSent,
  setResetSent,
  registerSuccessMsg,
  onEmailSubmit,
  onClearError,
}: EmailAuthFormProps) {
  if (emailMode === 'RESET') {
    return (
      <View style={styles.formSection}>
        <Text style={styles.resetHeaderTitle}>{t('authResetPasswordTitle')}</Text>
        <Text style={styles.subtext}>{t('authResetPasswordDesc')}</Text>

        {resetSent ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{t('authResetSentSuccess')}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.label}>{t('authEmailLabel')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('authEmailPlaceholder')}
              placeholderTextColor={Tokens.colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
              testID="email-reset-input"
              autoFocus
            />

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={onEmailSubmit}
              disabled={loading}
              testID="send-reset-button"
            >
              {loading ? (
                <ActivityIndicator color={Tokens.colors.primaryForeground} />
              ) : (
                <Text style={styles.primaryBtnText}>{t('authSendResetBtn')}</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={[styles.linkBtn, { marginTop: Tokens.spacing.md, alignSelf: 'center' }]}
          onPress={() => {
            setEmailMode('SIGN_IN');
            onClearError();
            setResetSent(false);
          }}
          testID="back-to-signin-button"
        >
          <Text style={styles.linkBtnText}>{t('authBackToLogin')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.formSection}>
      {emailMode === 'REGISTER' && (
        <>
          <Text style={styles.label}>{t('authNameLabel')}</Text>
          <TextInput
            style={[styles.textInput, { marginBottom: Tokens.spacing.sm }]}
            placeholder={t('authNamePlaceholder')}
            placeholderTextColor={Tokens.colors.textMuted}
            autoComplete="name"
            textContentType="name"
            value={name}
            onChangeText={setName}
            testID="email-name-input"
          />
        </>
      )}

      <Text style={styles.label}>{t('authEmailLabel')}</Text>
      <TextInput
        style={[styles.textInput, { marginBottom: Tokens.spacing.sm }]}
        placeholder={t('authEmailPlaceholder')}
        placeholderTextColor={Tokens.colors.textMuted}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        value={email}
        onChangeText={setEmail}
        testID="email-input"
        autoFocus={emailMode === 'SIGN_IN'}
      />

      <View style={styles.labelRow}>
        <Text style={styles.label}>{t('authPasswordLabel')}</Text>
        <TouchableOpacity
          onPress={() => setShowPassword((prev) => !prev)}
          style={[styles.showHideLabelBtn, Platform.OS === 'web' && ({ cursor: 'pointer' } as unknown as ViewStyle)]}
          accessibilityRole="button"
          testID="toggle-password-text-btn"
        >
          <Text style={styles.showHideLabelText}>
            {showPassword ? t('authHidePassword') : t('authShowPassword')}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder={t('authPasswordPlaceholder')}
          placeholderTextColor={Tokens.colors.textMuted}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete={emailMode === 'REGISTER' ? 'new-password' : 'current-password'}
          textContentType={emailMode === 'REGISTER' ? 'newPassword' : 'password'}
          value={password}
          onChangeText={setPassword}
          testID="password-input"
        />
        <TouchableOpacity
          style={styles.passwordToggleBtn}
          onPress={() => setShowPassword((prev) => !prev)}
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          accessibilityRole="button"
          testID="toggle-password-visibility"
        >
          {showPassword ? (
            <EyeOff size={20} color={Tokens.colors.textMuted} />
          ) : (
            <Eye size={20} color={Tokens.colors.textMuted} />
          )}
        </TouchableOpacity>
      </View>

      {registerSuccessMsg && (
        <View style={styles.successBox} testID="register-success-box">
          <Text style={styles.successText}>{registerSuccessMsg}</Text>
        </View>
      )}

      {emailMode === 'SIGN_IN' && (
        <TouchableOpacity
          style={[styles.linkBtn, { alignSelf: 'flex-end', marginTop: Tokens.spacing.xs }]}
          onPress={() => {
            setEmailMode('RESET');
            onClearError();
          }}
          testID="forgot-password-button"
        >
          <Text style={styles.linkBtnText}>{t('authForgotPasswordBtn')}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={onEmailSubmit}
        disabled={loading}
        testID="email-submit-button"
      >
        {loading ? (
          <ActivityIndicator color={Tokens.colors.primaryForeground} />
        ) : (
          <Text style={styles.primaryBtnText}>
            {emailMode === 'REGISTER' ? t('authCreateAccountBtn') : t('authSignInBtn')}
          </Text>
        )}
      </TouchableOpacity>

      <View style={[styles.actionRow, { justifyContent: 'center' }]}>
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => {
            setEmailMode(emailMode === 'SIGN_IN' ? 'REGISTER' : 'SIGN_IN');
            onClearError();
          }}
          testID={emailMode === 'SIGN_IN' ? 'switch-to-register' : 'switch-to-signin'}
        >
          <Text style={styles.linkBtnText}>
            {emailMode === 'SIGN_IN'
              ? t('authSwitchToCreateAccount')
              : t('authSwitchToSignIn')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formSection: {
    gap: Tokens.spacing.xs,
  },
  resetHeaderTitle: {
    ...Typography.headlineSm,
    color: Tokens.colors.text,
    marginBottom: 4,
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  showHideLabelBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  showHideLabelText: {
    ...Typography.labelSm,
    color: Tokens.colors.primary,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Tokens.colors.surface,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    borderRadius: Tokens.radii.card,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.sm,
    ...Typography.bodyMd,
    color: Tokens.colors.text,
  },
  passwordToggleBtn: {
    padding: Tokens.spacing.sm,
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
  successBox: {
    backgroundColor: Tokens.colors.surfaceMuted,
    borderRadius: Tokens.radii.sm,
    padding: Tokens.spacing.sm,
    marginVertical: Tokens.spacing.xs,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  successText: {
    ...Typography.bodySm,
    color: Tokens.colors.greenText,
  },
});
