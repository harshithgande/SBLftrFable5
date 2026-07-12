import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import { colors, radii, spacing, tapTarget, type } from '../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'premium';
type Size = 'large' | 'medium' | 'small';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  accessibilityHint?: string;
  style?: ViewStyle;
}

const BG: Record<Variant, string> = {
  primary: colors.accent,
  secondary: colors.surfaceRaised,
  ghost: 'transparent',
  danger: colors.dangerDim,
  premium: colors.premium,
};

const FG: Record<Variant, string> = {
  primary: colors.textInverse,
  secondary: colors.text,
  ghost: colors.textSecondary,
  danger: colors.danger,
  premium: colors.textInverse,
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'large',
  disabled = false,
  loading = false,
  icon,
  accessibilityHint,
  style,
}: Props) {
  const inactive = disabled || loading;
  const height = size === 'large' ? 54 : size === 'medium' ? tapTarget : 38;
  const textStyle: TextStyle =
    size === 'small' ? { ...type.bodyStrong, fontSize: 13 } : { ...type.bodyStrong, fontSize: 16 };

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: BG[variant],
          height,
          opacity: inactive ? 0.5 : pressed ? 0.82 : 1,
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={FG[variant]} />
      ) : (
        <View style={styles.content}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text style={[textStyle, { color: FG[variant] }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  content: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: spacing.sm },
});
