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
import { PadelBrand } from '@/constants/theme';
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
            <Text style={styles.brandTitle}>PADEL GHANA</Text>
            <Text style={styles.flagEmoji}>🇬🇭</Text>
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
                  <Text style={styles.prefixText}>🇬🇭 +233</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="024 123 4567"
                  placeholderTextColor="#64748B"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  autoFocus
                />
              </View>

              <Text style={[styles.label, { marginTop: 16 }]}>Your Name (optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Kwame Mensah"
                placeholderTextColor="#64748B"
                value={name}
                onChangeText={setName}
              />

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleRequestOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#0B0F0E" />
                ) : (
                  <Text style={styles.primaryBtnText}>Send Login Code →</Text>
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
                Sent via SMS to <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{phone}</Text>
              </Text>

              <TextInput
                style={styles.otpInput}
                placeholder="123456"
                placeholderTextColor="#64748B"
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
              >
                {loading ? (
                  <ActivityIndicator color="#0B0F0E" />
                ) : (
                  <Text style={styles.primaryBtnText}>Verify & Continue</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => setStep('PHONE')}
                disabled={loading}
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
    backgroundColor: PadelBrand.charcoal,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: PadelBrand.cardDark,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  flagEmoji: {
    fontSize: 22,
  },
  tagline: {
    color: PadelBrand.electricGreen,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: '#3F1212',
    borderWidth: 1,
    borderColor: '#7F1D1D',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
  },
  formSection: {
    width: '100%',
  },
  label: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
    backgroundColor: '#0E1311',
    overflow: 'hidden',
  },
  prefixBadge: {
    backgroundColor: '#1E2824',
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: PadelBrand.borderDark,
  },
  prefixText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  textInput: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PadelBrand.borderDark,
    backgroundColor: '#0E1311',
    paddingHorizontal: 14,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  otpInput: {
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PadelBrand.electricGreen,
    backgroundColor: '#0E1311',
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 16,
  },
  subtext: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: PadelBrand.electricGreen,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  primaryBtnText: {
    color: '#0B0F0E',
    fontSize: 16,
    fontWeight: '800',
  },
  linkBtn: {
    alignSelf: 'center',
    marginTop: 16,
    padding: 8,
  },
  linkBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  disclaimerText: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 16,
  },
});
