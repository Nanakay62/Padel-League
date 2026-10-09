import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  Platform,
  View,
} from 'react-native';
import { Tokens, Typography } from '@/constants/theme';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  icon?: React.ReactNode;
}

export function Chip({
  label,
  selected = false,
  onPress,
  style,
  textStyle,
  accessibilityLabel,
  icon,
}: ChipProps) {
  const content = (
    <>
      {icon}
      <Text
        style={[
          styles.text,
          selected ? styles.selectedText : styles.unselectedText,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={accessibilityLabel ?? label}
        onPress={onPress}
        style={({ pressed, focused }: any) => [
          styles.chip,
          selected ? styles.selectedChip : styles.unselectedChip,
          pressed && styles.pressed,
          focused && Platform.OS === 'web' && styles.focusedWeb,
          style,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.chip,
        selected ? styles.selectedChip : styles.unselectedChip,
        style,
      ]}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: Tokens.touch.minTarget,
    paddingHorizontal: Tokens.spacing.base,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Tokens.spacing.xs,
  },
  unselectedChip: {
    backgroundColor: Tokens.colors.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  selectedChip: {
    backgroundColor: Tokens.colors.text,
    borderWidth: 1,
    borderColor: Tokens.colors.text,
  },
  pressed: {
    opacity: 0.8,
  },
  focusedWeb: {
    outlineWidth: 2,
    outlineColor: Tokens.colors.primary,
    outlineStyle: 'solid',
  } as ViewStyle,
  text: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
  },
  unselectedText: {
    color: Tokens.colors.text,
  },
  selectedText: {
    color: Tokens.colors.card,
  },
});
