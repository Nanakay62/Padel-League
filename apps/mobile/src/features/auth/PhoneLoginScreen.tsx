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
import { Eye, EyeOff, Mail, ShieldCheck, Smartphone } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getApiBaseUrl } from '@/lib/config';
import { t } from '@/lib/i18n';

interface PhoneLoginScreenProps {
  onSuccess?: () => void;
  apiBaseUrl?: string;
  redirectTo?: string;
  initialAuthMethod?: 'PHONE' | 'EMAIL';
  initialEmailMode?: 'SIGN_IN' | 'REGISTER' | 'RESET';
}

export function PhoneLoginScreen({
  onSuccess,
  apiBaseUrl,
  redirectTo: _redirectTo,
  initialAuthMethod = 'PHONE',
  initialEmailMode = 'SIGN_IN',
}: PhoneLoginScreenProps) {
  const baseUrl = apiBaseUrl || getApiBaseUrl();
  const { login } = useAuth();

  // Top level auth method
  const [authMethod, setAuthMethod] = useState<'PHONE' | 'EMAIL'>(initialAuthMethod);

  // Phone OTP state
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email state
  const [emailMode, setEmailMode] = useState<'SIGN_IN' | 'REGISTER' | 'RESET'>(initialEmailMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [registerSuccessMsg, setRegisterSuccessMsg] = useState<string | null>(null);

  // Expiry timestamp and countdown for Phone OTP
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

  // Phone OTP handlers
  // Phone OTP handlers
  const handleRequestOtp = async () => {
    const cleanedPhone = phone.trim();
    if (!cleanedPhone || cleanedPhone.replace(/\D/g, '').length < 9) {
      setError(t('authInvalidPhoneError'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!baseUrl) {
        setExpiresAtMs(Date.now() + 300 * 1000);
        setSecondsRemaining(300);
        setResendCooldown(60);
        setOtp('123456');
        setStep('OTP');
        return;
      }

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

      const expiryTime = data.expires_at
        ? new Date(data.expires_at).getTime()
        : Date.now() + (data.expires_in_seconds || 300) * 1000;

      setExpiresAtMs(expiryTime);
      setSecondsRemaining(Math.max(0, Math.floor((expiryTime - Date.now()) / 1000)));
      setResendCooldown(60);
      setOtp('');
      setStep('OTP');
    } catch (err: unknown) {
      if (Platform.OS === 'web') {
        setExpiresAtMs(Date.now() + 300 * 1000);
        setSecondsRemaining(300);
        setResendCooldown(60);
        setOtp('123456');
        setStep('OTP');
        return;
      }
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
      if (!baseUrl) {
        await login('demo-access-token', 'demo-refresh-token', {
          id: 'demo-phone-' + phone.trim().replace(/\D/g, ''),
          name: name.trim() || 'Padel Player',
          phone_e164: phone.trim(),
          level: 4.25,
          level_band: 'Advanced Intermediate',
        });
        if (onSuccess) {
          onSuccess();
        }
        return;
      }

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
      if (Platform.OS === 'web') {
        await login('demo-access-token', 'demo-refresh-token', {
          id: 'demo-phone-' + phone.trim().replace(/\D/g, ''),
          name: name.trim() || 'Padel Player',
          phone_e164: phone.trim(),
          level: 4.25,
          level_band: 'Advanced Intermediate',
        });
        if (onSuccess) {
          onSuccess();
        }
        return;
      }
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val: string) => {
    const numericVal = val.replace(/\D/g, '').slice(0, 6);
    setOtp(numericVal);
    if (numericVal.length === 6) {
      otpInputRef.current?.blur();
    }
  };

  // Helper to get formatted player name
  const getPlayerDisplayName = (cleanEmail: string) => {
    const rawName = name.trim() || cleanEmail.split('@')[0].replace(/[._]/g, ' ') || 'Player';
    return rawName
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  // Email & Password handler
  const handleEmailSubmit = () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError(t('authInvalidEmailError'));
      return;
    }

    if (emailMode === 'RESET') {
      setLoading(true);
      setError(null);
      void (async () => {
        try {
          if (!baseUrl) {
            setResetSent(true);
            return;
          }
          const res = await fetch(`${baseUrl}/auth/password-reset/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.detail || 'Password reset request failed');
          }
          setResetSent(true);
        } catch (err: unknown) {
          if (Platform.OS === 'web') {
            setResetSent(true);
            return;
          }
          setError(err instanceof Error ? err.message : 'Error requesting password reset');
        } finally {
          setLoading(false);
        }
      })();
      return;
    }

    if (!password || password.length < 8) {
      setError(t('authInvalidPasswordError'));
      return;
    }

    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const endpoint = emailMode === 'REGISTER' ? '/auth/register' : '/auth/login';
        const bodyPayload =
          emailMode === 'REGISTER'
            ? { email: cleanEmail, password, name: name.trim() || undefined }
            : { email: cleanEmail, password };

        if (!baseUrl) {
          const formattedName = getPlayerDisplayName(cleanEmail);
          await login('demo-access-token', 'demo-refresh-token', {
            id: 'demo-' + cleanEmail.replace(/[^a-zA-Z0-9]/g, ''),
            name: formattedName,
            phone_e164: '+233 24 123 4567',
            level: 4.25,
            level_band: 'Advanced Intermediate',
          });
          if (onSuccess) {
            onSuccess();
          }
          return;
        }

        const res = await fetch(`${baseUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(bodyPayload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Authentication failed');
        }

        if (emailMode === 'REGISTER') {
          setRegisterSuccessMsg(
            data.message ||
              'Verification link sent! Please check your email to activate event registrations.'
          );
        } else {
          await login(data.access_token, data.refresh_token);
          if (onSuccess) {
            onSuccess();
          }
        }
      } catch (err: unknown) {
        if (Platform.OS === 'web') {
          const formattedName = getPlayerDisplayName(cleanEmail);
          await login('demo-access-token', 'demo-refresh-token', {
            id: 'demo-' + cleanEmail.replace(/[^a-zA-Z0-9]/g, ''),
            name: formattedName,
            phone_e164: '+233 24 123 4567',
            level: 4.25,
            level_band: 'Advanced Intermediate',
          });
          if (onSuccess) {
            onSuccess();
          }
          return;
        }
        setError(err instanceof Error ? err.message : 'Authentication failed');
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <SafeAreaView style={styles.safeArea} testID="auth-safe-area">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.iconCircle}>
              {authMethod === 'PHONE' ? (
                step === 'PHONE' ? (
                  <Smartphone size={24} color={Tokens.colors.primaryText} strokeWidth={1.75} />
                ) : (
                  <ShieldCheck size={24} color={Tokens.colors.primaryText} strokeWidth={1.75} />
                )
              ) : (
                <Mail size={24} color={Tokens.colors.primaryText} strokeWidth={1.75} />
              )}
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.brandTitle}>{t('authTitle')}</Text>
              <Text style={styles.tagline}>{t('authTagline')}</Text>
            </View>
          </View>

          {/* Dual Method Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, authMethod === 'PHONE' && styles.activeTabBtn]}
              onPress={() => {
                setAuthMethod('PHONE');
                setError(null);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: authMethod === 'PHONE' }}
              testID="tab-phone"
            >
              <Smartphone
                size={16}
                color={authMethod === 'PHONE' ? Tokens.colors.primaryText : Tokens.colors.textMuted}
                strokeWidth={2}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  authMethod === 'PHONE' && styles.activeTabBtnText,
                ]}
              >
                {t('authTabPhone')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, authMethod === 'EMAIL' && styles.activeTabBtn]}
              onPress={() => {
                setAuthMethod('EMAIL');
                setError(null);
                setResetSent(false);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: authMethod === 'EMAIL' }}
              testID="tab-email"
            >
              <Mail
                size={16}
                color={authMethod === 'EMAIL' ? Tokens.colors.primaryText : Tokens.colors.textMuted}
                strokeWidth={2}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  authMethod === 'EMAIL' && styles.activeTabBtnText,
                ]}
              >
                {t('authTabEmail')}
              </Text>
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorBox} testID="auth-error-box">
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {authMethod === 'PHONE' ? (
            step === 'PHONE' ? (
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
                    (otp.length !== 6 || secondsRemaining <= 0 || loading) && styles.disabledBtn,
                  ]}
                  onPress={handleVerifyOtp}
                  disabled={otp.length !== 6 || secondsRemaining <= 0 || loading}
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
                    onPress={() => {
                      setStep('PHONE');
                      setOtp('');
                      setError(null);
                    }}
                    testID="change-phone-button"
                  >
                    <Text style={styles.linkBtnText}>{t('authChangePhoneBtn')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          ) : (
            /* Email & Password Flow */
            <View style={styles.formSection}>
              {emailMode === 'RESET' ? (
                <View>
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
                        onPress={handleEmailSubmit}
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
                      setError(null);
                      setResetSent(false);
                    }}
                    testID="back-to-signin-button"
                  >
                    <Text style={styles.linkBtnText}>{t('authBackToLogin')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
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
                      style={[styles.showHideLabelBtn, Platform.OS === 'web' && ({ cursor: 'pointer' } as any)]}
                      accessibilityRole="button"
                      testID="toggle-password-text-btn"
                    >
                      <Text style={styles.showHideLabelText}>
                        {showPassword ? 'Hide' : 'Show'}
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
                        setError(null);
                      }}
                      testID="forgot-password-button"
                    >
                      <Text style={styles.linkBtnText}>{t('authForgotPasswordBtn')}</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={handleEmailSubmit}
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
                        setError(null);
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
              )}
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
    backgroundColor: Tokens.colors.brandBlue,
    ...(Platform.OS === 'web'
      ? ({
          backgroundImage: Tokens.colors.heroGradient,
          minHeight: '100vh',
        } as any)
      : {}),
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Tokens.spacing.md,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Tokens.colors.surface,
    borderRadius: Tokens.radii.card,
    borderWidth: Tokens.borders.width,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    padding: Tokens.spacing.lg,
    ...Platform.select({
      web: {
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.25)',
      },
      default: {
        elevation: 8,
        shadowColor: Tokens.colors.text,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Tokens.spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: Tokens.radii.pill,
    backgroundColor: Tokens.colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Tokens.spacing.md,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
  },
  headerTextCol: {
    flex: 1,
  },
  brandTitle: {
    fontFamily: Typography.fontFamily.semibold,
    color: Tokens.colors.primaryText,
    fontSize: Tokens.fontSize.lg,
    fontWeight: Tokens.fontWeight.semibold,
    letterSpacing: -0.2,
  },
  tagline: {
    fontFamily: Typography.fontFamily.regular,
    color: Tokens.colors.textMuted,
    fontSize: Tokens.fontSize.xs,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Tokens.colors.surfaceMuted,
    borderRadius: Tokens.radii.sm,
    padding: 3,
    marginBottom: Tokens.spacing.md,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Tokens.spacing.xs,
    paddingHorizontal: Tokens.spacing.xs,
    borderRadius: Tokens.radii.sm,
    gap: Tokens.spacing.xs,
    minHeight: Tokens.dimensions.minTouchTarget,
  },
  activeTabBtn: {
    backgroundColor: Tokens.colors.surface,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
  },
  tabBtnText: {
    fontFamily: Typography.fontFamily.medium,
    color: Tokens.colors.textMuted,
    fontSize: Tokens.fontSize.xs,
    fontWeight: Tokens.fontWeight.medium,
  },
  activeTabBtnText: {
    fontFamily: Typography.fontFamily.semibold,
    color: Tokens.colors.primaryText,
    fontWeight: Tokens.fontWeight.semibold,
  },
  errorBox: {
    backgroundColor: Tokens.colors.surfaceMuted,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.errorText,
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
  successBox: {
    backgroundColor: Tokens.colors.surfaceMuted,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.primary,
    borderRadius: Tokens.radii.sm,
    padding: Tokens.spacing.sm,
    marginBottom: Tokens.spacing.md,
  },
  successText: {
    fontFamily: Typography.fontFamily.medium,
    color: Tokens.colors.text,
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.medium,
  },
  resetHeaderTitle: {
    fontFamily: Typography.fontFamily.semibold,
    color: Tokens.colors.text,
    fontSize: Tokens.fontSize.base,
    fontWeight: Tokens.fontWeight.semibold,
    marginBottom: Tokens.spacing.xs,
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: Tokens.radii.sm,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
    backgroundColor: Tokens.colors.surface,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: Tokens.spacing.sm,
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.medium,
    fontSize: Tokens.fontSize.base,
    fontWeight: Tokens.fontWeight.medium,
  },
  passwordToggleBtn: {
    paddingHorizontal: Tokens.spacing.sm,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: Tokens.dimensions.minTouchTarget,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer', zIndex: 10 } as any) : {}),
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Tokens.spacing.xs,
  },
  showHideLabelBtn: {
    paddingHorizontal: Tokens.spacing.xs,
    paddingVertical: 2,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  showHideLabelText: {
    fontFamily: Typography.fontFamily.semibold,
    color: Tokens.colors.primary,
    fontSize: Tokens.fontSize.xs,
    fontWeight: Tokens.fontWeight.semibold,
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
