import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Tokens, Typography } from '@/constants/theme';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  actionTitle?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  icon,
  title,
  message,
  actionTitle,
  onActionPress,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionTitle && onActionPress ? (
        <Button
          title={actionTitle}
          onPress={onActionPress}
          variant="secondary"
          style={styles.actionButton}
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
    borderColor: Tokens.colors.border,
  },
  iconContainer: {
    marginBottom: Tokens.spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
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
  actionButton: {
    marginTop: Tokens.spacing.base,
  },
});
