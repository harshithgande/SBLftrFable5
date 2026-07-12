import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, type } from '../theme';

interface Props {
  /** 0..1 */
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  centerLabel?: string;
  centerSub?: string;
  accessibilityLabel: string;
}

export function RingProgress({
  progress,
  size = 84,
  strokeWidth = 8,
  color = colors.accent,
  centerLabel,
  centerSub,
  accessibilityLabel,
}: Props) {
  const clamped = Math.max(0, Math.min(1, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <View
      style={{ width: size, height: size }}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surfaceRaised}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - clamped)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {centerLabel ? (
        <View style={styles.center} pointerEvents="none">
          <Text style={[type.subheading, { fontVariant: ['tabular-nums'] }]}>{centerLabel}</Text>
          {centerSub ? <Text style={type.caption}>{centerSub}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
