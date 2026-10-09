import React from 'react';
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Tokens, Typography } from '@/constants/theme';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

export function ListRow({
  title,
  subtitle,
  left,
  right,
  onPress,
  showChevron = false,
  style,
  accessibilityLabel,
  testID,
}: ListRowProps) {
  const content = (
    <View style={styles.inner}>
      {left ? <View style={styles.leftContainer}>{left}</View> : null}
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.rightContainer}>{right}</View> : null}
      {showChevron && (
        <ChevronRight
          size={18}
          color={Tokens.colors.textMuted}
          strokeWidth={1.75}
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        onPress={onPress}
        style={({ pressed, focused }: any) => [
          styles.row,
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
    <View testID={testID} style={[styles.row, style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: Tokens.touch.minTarget,
    backgroundColor: Tokens.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.colors.border,
    paddingHorizontal: Tokens.spacing.base,
    paddingVertical: Tokens.spacing.md,
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.md,
  },
  leftContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    color: Tokens.colors.text,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.textMuted,
    marginTop: Tokens.spacing.xs,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  pressed: {
    opacity: 0.8,
  },
  focusedWeb: {
    outlineWidth: 2,
    outlineColor: Tokens.colors.primary,
    outlineStyle: 'solid',
  } as ViewStyle,
});
