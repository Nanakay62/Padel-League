import React from 'react';
import { StyleSheet, Text, View, Pressable, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Tokens, Typography } from '@/constants/theme';

export interface PlayerAvatarProps {
  initials: string;
  size?: number;
  isCurrentUser?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

export function PlayerAvatar({
  initials,
  size = 56,
  isCurrentUser = false,
  onPress,
  style,
  textStyle,
  accessibilityLabel,
}: PlayerAvatarProps) {
  const innerSize = isCurrentUser ? size - 6 : size;
  const fontSize = Math.round(innerSize * 0.38);

  const content = (
    <View
      style={[
        styles.avatarBase,
        {
          width: innerSize,
          height: innerSize,
          borderRadius: Tokens.radii.pill,
        },
        isCurrentUser ? styles.currentUserAvatar : styles.standardAvatar,
      ]}
    >
      <Text
        style={[
          styles.initialsText,
          {
            fontSize,
            lineHeight: fontSize + 2,
          },
          textStyle,
        ]}
      >
        {initials}
      </Text>
    </View>
  );

  const containerStyle = [
    styles.container,
    { width: size, height: size },
    isCurrentUser && styles.currentUserRing,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? initials}
        onPress={onPress}
        style={containerStyle}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={containerStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Tokens.radii.pill,
  },
  currentUserRing: {
    borderWidth: 2,
    borderColor: Tokens.colors.lime,
    backgroundColor: Tokens.colors.court,
    padding: 2,
  },
  avatarBase: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  standardAvatar: {
    backgroundColor: Tokens.colors.chalk,
  },
  currentUserAvatar: {
    backgroundColor: Tokens.colors.lime,
  },
  initialsText: {
    fontFamily: Typography.fontFamily.display,
    fontWeight: Tokens.fontWeight.bold,
    color: Tokens.colors.ink,
    letterSpacing: -0.5,
  },
});
