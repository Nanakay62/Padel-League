import React, { useEffect, useState } from 'react';
import {
  Animated,
  StyleSheet,
  ViewStyle,
  StyleProp,
  DimensionValue,
  AccessibilityInfo,
} from 'react-native';
import { Tokens } from '@/constants/theme';

export interface SkeletonLoaderProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function SkeletonLoader({
  width = '100%',
  height = 16,
  borderRadius = Tokens.radii.sm,
  style,
  testID = 'skeleton-loader',
}: SkeletonLoaderProps) {
  const [opacityAnim] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    let isCancelled = false;

    // Check reduced motion
    AccessibilityInfo.isReduceMotionEnabled().then((reducedMotion) => {
      if (isCancelled || reducedMotion) {
        opacityAnim.setValue(0.5);
        return;
      }

      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.85,
            duration: Tokens.motion.duration.slow,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.4,
            duration: Tokens.motion.duration.slow,
            useNativeDriver: true,
          }),
        ])
      );

      pulseAnimation.start();
    }).catch(() => {
      // Default fallback loop if API check fails
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.85,
            duration: Tokens.motion.duration.slow,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.4,
            duration: Tokens.motion.duration.slow,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    return () => {
      isCancelled = true;
      opacityAnim.stopAnimation();
    };
  }, [opacityAnim]);

  return (
    <Animated.View
      testID={testID}
      accessibilityRole="progressbar"
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Tokens.colors.track,
  },
});
