import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Tokens, MaxContentWidth } from '@/constants/theme';

export interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  variant?: 'light' | 'dark';
  testID?: string;
}

export function Screen({
  children,
  scrollable = true,
  style,
  contentContainerStyle,
  variant = 'light',
  testID,
}: ScreenProps) {
  const isDark = variant === 'dark';
  const containerBg = isDark
    ? Tokens.colors.live.background
    : Tokens.colors.background;

  const content = (
    <View style={[styles.innerContainer, style]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView
      testID={testID}
      edges={['top', 'left', 'right']}
      style={[styles.root, { backgroundColor: containerBg }]}
    >
      {scrollable ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Tokens.spacing.xxxl,
  },
  innerContainer: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Tokens.spacing.base,
    paddingTop: Tokens.spacing.base,
  },
});
