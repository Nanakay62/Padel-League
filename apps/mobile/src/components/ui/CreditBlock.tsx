import React from 'react';
import { StyleSheet, Text, View, Pressable, StyleProp, ViewStyle } from 'react-native';
import { Tokens, Typography } from '@/constants/theme';
import { formatGhanaCedis } from '@/lib/formatting';

export interface CreditBlockProps {
  balancePesewas?: number;
  label?: string;
  onTopUpPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function CreditBlock({
  balancePesewas = 5000, // Default 50.00 GHS in pesewas
  label = 'CREDIT BALANCE',
  onTopUpPress,
  style,
  testID,
}: CreditBlockProps) {
  const formattedBalance = formatGhanaCedis(balancePesewas);

  return (
    <View style={[styles.card, style]} testID={testID}>
      {/* Eyebrow Label */}
      <Text style={styles.eyebrow}>{label}</Text>

      {/* Big Currency Display */}
      <Text style={styles.amountText}>{formattedBalance}</Text>

      {/* Primary Action Button: Ink fill with chalk text */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Top up with MoMo"
        onPress={onTopUpPress}
        style={({ pressed }) => [styles.topUpButton, pressed && styles.buttonPressed]}
      >
        <Text style={styles.topUpButtonText}>Top up with MoMo</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Tokens.colors.lime,
    borderRadius: Tokens.radii.cardLg,
    padding: Tokens.spacing.xl,
    width: '100%',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    fontWeight: Tokens.fontWeight.semibold,
    letterSpacing: 1.0,
    color: Tokens.colors.ink,
    textTransform: 'uppercase',
  },
  amountText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: Tokens.fontSize.display,
    lineHeight: Tokens.lineHeight.display,
    fontWeight: Tokens.fontWeight.bold,
    letterSpacing: -1.0,
    color: Tokens.colors.ink,
    marginVertical: Tokens.spacing.md,
  },
  topUpButton: {
    backgroundColor: Tokens.colors.ink,
    borderRadius: Tokens.radii.button,
    minHeight: Tokens.touch.minTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Tokens.spacing.xl,
    paddingVertical: Tokens.spacing.md,
    alignSelf: 'flex-start',
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  topUpButtonText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Tokens.fontSize.base,
    fontWeight: Tokens.fontWeight.bold,
    color: Tokens.colors.chalk,
  },
});
