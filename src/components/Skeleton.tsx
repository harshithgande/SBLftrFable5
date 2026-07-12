import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, ViewStyle } from 'react-native';

import { colors, radii } from '../theme';

interface Props {
  width?: ViewStyle['width'];
  height?: number;
  style?: ViewStyle;
}

/** Pulsing loading placeholder; respects reduce-motion. */
export function Skeleton({ width = '100%', height = 16, style }: Props) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (reduced || cancelled) return;
        loop = Animated.loop(
          Animated.sequence([
            Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
          ])
        );
        loop.start();
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [opacity]);

  return (
    <Animated.View
      accessibilityLabel="Loading"
      style={[styles.base, { width, height, opacity }, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.surfaceRaised, borderRadius: radii.sm },
});
