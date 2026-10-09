import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ShieldCheck, Smartphone } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getApiBaseUrl } from '@/lib/config';
import { t } from '@/lib/i18n';

interface PhoneLoginScreenProps {
  onSuccess?: () => void;
  apiBaseUrl?: string;
  redirectTo?: string;
}

export function PhoneLoginScreen({
  onSuccess,
  apiBaseUrl,
  redirectTo,
}: PhoneLoginScreenProps) {
  const baseUrl = apiBaseUrl || getApiBaseUrl();
  const { login } = useAuth();

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Expiry timestamp and countdown
  const [expiresAtMs, setExpiresAtMs] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  const otpInputRef = useRef<TextInput>(null);

  // Interval timer for OTP expiry and resend cooldown
  useEffect(() => {
    if (step !== 'OTP' || !expiresAtMs) return;

    const updateTimers = () => {
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((expiresAtMs - now) / 1000));
      setSecondsRemaining(diffSec);

      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [step, expiresAtMs]);

  const formattedCountdown = useMemo(() => {
    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }, [secondsRemaining]);

  const handleRequestOtp = async () => {
    const cleanedPhone = phone.trim();
    if (!cleanedPhone || cleanedPhone.replace(/\D/g, '').length < 9) {
      setError(t('authInvalidPhoneError'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${baseUrl}/auth/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanedPhone }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          throw new Error(data.detail || t('authRateLimitError'));
        }
        throw new Error(data.detail || 'Failed to request verification code');
      }

      // Calculate expiry from server timestamp or fallback to duration
      const expiryTime = data.expires_at
        ? new Date(data.expires_at).getTime()
        : Date.now() + (data.expires_in_seconds || 300) * 1000;

      setExpiresAtMs(expiryTime);
      setSecondsRemaining(Math.max(0, Math.floor((expiryTime - Date.now()) / 1000)));
      setResendCooldown(60); // 60s cooldown before allowing resend
      setOtp('');
      setStep('OTP');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('authRateLimitError'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setError(t('authInvalidCodeError'));
      return;
    }

    if (secondsRemaining <= 0) {
      setError(t('authCodeExpired'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${baseUrl}/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone: phone.trim(),
          otp: cleanOtp,
          name: name.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Verification failed');
      }

      await login(data.access_token, data.refresh_token);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val: string) => {
    // Only allow numeric digits and trim paste to 6 chars
    const numericVal = val.replace(/\D/g, '').slice(0, 6);
    setOtp(numericVal);
    if (numericVal.length === 6) {
      // Auto-dismiss or auto-focus ready
      otpInputRef.current?.blur();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.iconCircle}>
              {step === 'PHONE' ? (
                <Smartphone size={24} color={Tokens.colors.primaryText} strokeWidth={1.75} />
              ) : (
                <ShieldCheck size={24} color={Tokens.colors.primaryText} strokeWidth={1.75} />
              )}
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.brandTitle}>{t('authTitle')}</Text>
              <Text style={styles.tagline}>{t('authTagline')}</Text>
            </View>
          </View>

          {error && (
            <View style={styles.errorBox} testID="auth-error-box">
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {step === 'PHONE' ? (
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
                onPress={handleRequestOtp}
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
          ) : (
            <View style={styles.formSection}>
              <Text style={styles.label}>{t('authEnterCodeLabel')}</Text>
              <Text style={styles.subtext}>
                {t('authCodeSentTo', { phone })}
              </Text>

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
                onChangeText={handleOtpChange}
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
                style={[
                  styles.primaryBtn,
                  secondsRemaining <= 0 && styles.disabledBtn,
                ]}
                onPress={handleVerifyOtp}
                disabled={loading || secondsRemaining <= 0}
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
                  onPress={handleRequestOtp}
                  disabled={loading || resendCooldown > 0}
                  accessibilityRole="button"
                  accessibilityLabel={t('authResendCodeBtn')}
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
                  onPress={() => {
                    setError(null);
                    setStep('PHONE');
                  }}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel={t('authChangePhoneBtn')}
                  testID="change-phone-button"
                >
                  <Text style={styles.linkBtnText}>{t('authChangePhoneBtn')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Tokens.colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Tokens.spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Tokens.colors.surface,
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.xl,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.md,
    marginBottom: Tokens.spacing.lg,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: Tokens.radii.pill,
    backgroundColor: Tokens.colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextCol: {
    flex: 1,
  },
  brandTitle: {
    fontFamily: Typography.fontFamily.semibold,
    color: Tokens.colors.text,
    fontSize: Tokens.fontSize.xl,
    fontWeight: Tokens.fontWeight.semibold,
    letterSpacing: -0.3,
  },
  tagline: {
    fontFamily: Typography.fontFamily.medium,
    color: Tokens.colors.primaryText,
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.medium,
    marginTop: 2,
  },
  errorBox: {
    backgroundColor: Tokens.colors.errorLight,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.errorBorder,
    borderRadius: Tokens.radii.sm,
    padding: Tokens.spacing.sm,
    marginBottom: Tokens.spacing.md,
  },
  errorText: {
    fontFamily: Typography.fontFamily.medium,
    color: Tokens.colors.errorText,
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.medium,
  },
  formSection: {
    width: '100%',
  },
  label: {
    fontFamily: Typography.fontFamily.semibold,
    color: Tokens.colors.text,
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.semibold,
    marginBottom: Tokens.spacing.xs,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    height: 48,
    borderRadius: Tokens.radii.sm,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
    backgroundColor: Tokens.colors.surface,
    overflow: 'hidden',
  },
  prefixBadge: {
    backgroundColor: Tokens.colors.surfaceMuted,
    paddingHorizontal: Tokens.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: Tokens.borders.width,
    borderRightColor: Tokens.colors.border,
  },
  prefixText: {
    fontFamily: Typography.fontFamily.semibold,
    color: Tokens.colors.text,
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.semibold,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: Tokens.spacing.sm,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.medium,
    fontSize: Tokens.fontSize.base,
    fontWeight: Tokens.fontWeight.medium,
  },
  textInput: {
    height: 48,
    borderRadius: Tokens.radii.sm,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
    backgroundColor: Tokens.colors.surface,
    paddingHorizontal: Tokens.spacing.sm,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.medium,
    fontSize: Tokens.fontSize.base,
    fontWeight: Tokens.fontWeight.medium,
  },
  otpInput: {
    height: 56,
    borderRadius: Tokens.radii.sm,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
    backgroundColor: Tokens.colors.surface,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Tokens.fontSize.xxl,
    fontWeight: Tokens.fontWeight.semibold,
    textAlign: 'center',
    letterSpacing: 10,
    fontVariant: ['tabular-nums'],
    marginBottom: Tokens.spacing.xs,
  },
  timerRow: {
    alignItems: 'center',
    marginTop: Tokens.spacing.xs,
    marginBottom: Tokens.spacing.md,
  },
  timerText: {
    fontFamily: Typography.fontFamily.regular,
    color: Tokens.colors.textMuted,
    fontSize: Tokens.fontSize.xs,
  },
  timerBold: {
    fontFamily: Typography.fontFamily.semibold,
    color: Tokens.colors.text,
    fontWeight: Tokens.fontWeight.semibold,
    fontVariant: ['tabular-nums'],
  },
  expiredText: {
    fontFamily: Typography.fontFamily.semibold,
    color: Tokens.colors.errorText,
    fontSize: Tokens.fontSize.xs,
    fontWeight: Tokens.fontWeight.semibold,
  },
  subtext: {
    fontFamily: Typography.fontFamily.regular,
    color: Tokens.colors.textMuted,
    fontSize: Tokens.fontSize.sm,
    marginBottom: Tokens.spacing.md,
  },
  primaryBtn: {
    backgroundColor: Tokens.colors.primary,
    minHeight: Tokens.dimensions.minTouchTarget,
    height: 48,
    borderRadius: Tokens.radii.button,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Tokens.spacing.md,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  primaryBtnText: {
    fontFamily: Typography.fontFamily.semibold,
    color: Tokens.colors.primaryForeground,
    fontSize: Tokens.fontSize.base,
    fontWeight: Tokens.fontWeight.semibold,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Tokens.spacing.md,
  },
  linkBtn: {
    minHeight: Tokens.dimensions.minTouchTarget,
    justifyContent: 'center',
    paddingVertical: Tokens.spacing.xs,
    paddingHorizontal: Tokens.spacing.xs,
  },
  linkBtnText: {
    fontFamily: Typography.fontFamily.semibold,
    color: Tokens.colors.textMuted,
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.semibold,
  },
  linkBtnDisabled: {
    color: Tokens.colors.border,
  },
  disclaimerText: {
    fontFamily: Typography.fontFamily.regular,
    color: Tokens.colors.textMuted,
    fontSize: Tokens.fontSize.xs,
    textAlign: 'center',
    marginTop: Tokens.spacing.sm,
    lineHeight: 16,
  },
});
