import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';
import { Button } from './Button';
import { t } from '@/lib/i18n';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  retryTitle?: string;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function ErrorState({
  title = t('errorGenericTitle'),
  message = t('errorGenericMessage'),
  retryTitle = t('retryBtn'),
  onRetry,
  style,
  testID = 'error-state',
}: ErrorStateProps) {
  return (
    <View style={[styles.container, style]} testID={testID} accessibilityRole="alert">
      <View style={styles.iconCircle}>
        <AlertCircle size={28} color={Tokens.colors.danger} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {onRetry ? (
        <Button
          title={retryTitle}
          onPress={onRetry}
          variant="secondary"
          style={styles.retryButton}
          testID={`${testID}-retry-btn`}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Tokens.spacing.xxxl,
    paddingHorizontal: Tokens.spacing.xl,
    backgroundColor: Tokens.colors.card,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.errorBorder,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Tokens.colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Tokens.spacing.base,
  },
  title: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.lg,
    lineHeight: Tokens.lineHeight.lg,
    color: Tokens.colors.text,
    textAlign: 'center',
  },
  message: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textMuted,
    textAlign: 'center',
    marginTop: Tokens.spacing.xs,
    maxWidth: 320,
  },
  retryButton: {
    marginTop: Tokens.spacing.lg,
    minWidth: 140,
  },
});
