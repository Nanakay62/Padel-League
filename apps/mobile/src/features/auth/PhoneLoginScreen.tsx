import React, { useState } from 'react';
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
import { Tokens } from '@/constants/theme';
import { saveAuthTokens } from '@/lib/auth-storage';

interface PhoneLoginScreenProps {
  onSuccess: () => void;
  apiBaseUrl?: string;
}

export function PhoneLoginScreen({
  onSuccess,
  apiBaseUrl = 'http://localhost:8000',
}: PhoneLoginScreenProps) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestOtp = async () => {
    if (!phone || phone.length < 9) {
      setError('Please enter a valid Ghana phone number (e.g. 024 123 4567)');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/auth/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to request verification code');
      }
      setStep('OTP');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter the full 6-digit verification code');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Verification failed');
      }
      await saveAuthTokens(data.access_token, data.refresh_token);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.card}>
          <View style={styles.logoRow}>
            <Text style={styles.brandTitle}>Padel Ghana</Text>
          </View>
          <Text style={styles.tagline}>Play. Connect. Compete.</Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {step === 'PHONE' ? (
            <View style={styles.formSection}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.phoneInputContainer}>
                <View style={styles.prefixBadge}>
                  <Text style={styles.prefixText}>+233</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="024 123 4567"
                  placeholderTextColor={Tokens.colors.textMuted}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  autoFocus
                />
              </View>

              <Text style={[styles.label, { marginTop: Tokens.spacing.md }]}>Your Name (optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Kwame Mensah"
                placeholderTextColor={Tokens.colors.textMuted}
                value={name}
                onChangeText={setName}
              />

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleRequestOtp}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Send Login Code"
              >
                {loading ? (
                  <ActivityIndicator color={Tokens.colors.primaryForeground} />
                ) : (
                  <Text style={styles.primaryBtnText}>Send Login Code</Text>
                )}
              </TouchableOpacity>
              <Text style={styles.disclaimerText}>
                We will send an SMS with a 6-digit code. Standard network rates apply.
              </Text>
            </View>
          ) : (
            <View style={styles.formSection}>
              <Text style={styles.label}>Enter 6-Digit Code</Text>
              <Text style={styles.subtext}>
                Sent via SMS to <Text style={styles.phoneHighlight}>{phone}</Text>
              </Text>

              <TextInput
                style={styles.otpInput}
                placeholder="123456"
                placeholderTextColor={Tokens.colors.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                autoFocus
              />

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleVerifyOtp}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Verify and Continue"
              >
                {loading ? (
                  <ActivityIndicator color={Tokens.colors.primaryForeground} />
                ) : (
                  <Text style={styles.primaryBtnText}>Verify and Continue</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => setStep('PHONE')}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Change phone number"
              >
                <Text style={styles.linkBtnText}>Change phone number</Text>
              </TouchableOpacity>
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
    padding: Tokens.spacing.lg,
  },
  card: {
    backgroundColor: Tokens.colors.surface,
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.lg,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.border,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    color: Tokens.colors.text,
    fontSize: Tokens.fontSize.xl,
    fontWeight: Tokens.fontWeight.semibold,
    letterSpacing: -0.5,
  },
  tagline: {
    color: Tokens.colors.primaryText,
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.semibold,
    marginTop: Tokens.spacing.xs,
    marginBottom: Tokens.spacing.lg,
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
    color: Tokens.colors.errorText,
    fontSize: Tokens.fontSize.sm,
  },
  formSection: {
    width: '100%',
  },
  label: {
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
    color: Tokens.colors.text,
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.semibold,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: Tokens.spacing.sm,
    color: Tokens.colors.text,
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
    fontSize: Tokens.fontSize.base,
    fontWeight: Tokens.fontWeight.medium,
  },
  otpInput: {
    height: 56,
    borderRadius: Tokens.radii.sm,
    borderWidth: Tokens.borders.width,
    borderColor: Tokens.colors.primary,
    backgroundColor: Tokens.colors.surface,
    color: Tokens.colors.text,
    fontSize: Tokens.fontSize.xxl,
    fontWeight: Tokens.fontWeight.semibold,
    textAlign: 'center',
    letterSpacing: 8,
    fontVariant: ['tabular-nums'],
    marginBottom: Tokens.spacing.md,
  },
  subtext: {
    color: Tokens.colors.textMuted,
    fontSize: Tokens.fontSize.sm,
    marginBottom: Tokens.spacing.md,
  },
  phoneHighlight: {
    color: Tokens.colors.text,
    fontWeight: Tokens.fontWeight.semibold,
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
  primaryBtnText: {
    color: Tokens.colors.primaryForeground,
    fontSize: Tokens.fontSize.base,
    fontWeight: Tokens.fontWeight.semibold,
  },
  linkBtn: {
    alignSelf: 'center',
    marginTop: Tokens.spacing.md,
    minHeight: Tokens.dimensions.minTouchTarget,
    justifyContent: 'center',
    padding: Tokens.spacing.xs,
  },
  linkBtnText: {
    color: Tokens.colors.textMuted,
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.semibold,
  },
  disclaimerText: {
    color: Tokens.colors.textMuted,
    fontSize: Tokens.fontSize.xs,
    textAlign: 'center',
    marginTop: Tokens.spacing.sm,
    lineHeight: 16,
  },
});
