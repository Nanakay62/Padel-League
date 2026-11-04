import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Mail, ShieldCheck, Smartphone } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getApiBaseUrl } from '@/lib/config';
import { t } from '@/lib/i18n';
import { PhoneAuthForm } from './components/PhoneAuthForm';
import { OtpVerificationView } from './components/OtpVerificationView';
import { EmailAuthForm } from './components/EmailAuthForm';

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

  const getPlayerDisplayName = (cleanEmail: string) => {
    const rawName = name.trim() || cleanEmail.split('@')[0].replace(/[._]/g, ' ') || 'Player';
    return rawName
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

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
              <PhoneAuthForm
                phone={phone}
                setPhone={setPhone}
                name={name}
                setName={setName}
                loading={loading}
                onRequestOtp={handleRequestOtp}
              />
            ) : (
              <OtpVerificationView
                phone={phone}
                otp={otp}
                onOtpChange={handleOtpChange}
                otpInputRef={otpInputRef}
                secondsRemaining={secondsRemaining}
                formattedCountdown={formattedCountdown}
                resendCooldown={resendCooldown}
                loading={loading}
                onVerifyOtp={handleVerifyOtp}
                onResendOtp={handleRequestOtp}
                onChangePhone={() => {
                  setStep('PHONE');
                  setOtp('');
                  setError(null);
                }}
              />
            )
          ) : (
            <EmailAuthForm
              emailMode={emailMode}
              setEmailMode={setEmailMode}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              name={name}
              setName={setName}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              loading={loading}
              resetSent={resetSent}
              setResetSent={setResetSent}
              registerSuccessMsg={registerSuccessMsg}
              onEmailSubmit={handleEmailSubmit}
              onClearError={() => setError(null)}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Tokens.colors.primary,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Tokens.spacing.base,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Tokens.colors.surface,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
    padding: Tokens.spacing.lg,
    gap: Tokens.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
    marginBottom: Tokens.spacing.xs,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Tokens.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
    gap: 2,
  },
  brandTitle: {
    ...Typography.headlineSm,
    color: Tokens.colors.text,
  },
  tagline: {
    ...Typography.bodySm,
    color: Tokens.colors.textMuted,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Tokens.colors.surfaceMuted,
    borderRadius: Tokens.radii.card,
    padding: 3,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Tokens.spacing.xs,
    paddingVertical: Tokens.spacing.sm,
    borderRadius: Tokens.radii.sm,
  },
  activeTabBtn: {
    backgroundColor: Tokens.colors.surface,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  tabBtnText: {
    ...Typography.labelSm,
    color: Tokens.colors.textMuted,
  },
  activeTabBtnText: {
    color: Tokens.colors.text,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  errorBox: {
    backgroundColor: Tokens.colors.surfaceMuted,
    borderRadius: Tokens.radii.sm,
    padding: Tokens.spacing.sm,
    borderWidth: 1,
    borderColor: Tokens.colors.danger,
  },
  errorText: {
    ...Typography.bodySm,
    color: Tokens.colors.danger,
  },
});
