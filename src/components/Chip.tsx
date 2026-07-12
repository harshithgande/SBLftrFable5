import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radii, spacing, type } from '../theme';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  accessibilityHint?: string;
}

export function Chip({ label, selected = false, onPress, accessibilityHint }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.selected : null,
        pressed ? { opacity: 0.8 } : null,
      ]}
    >
      <Text style={[styles.label, selected ? styles.labelSelected : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.lg,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentDim,
  },
  label: { ...type.bodyStrong, color: colors.textSecondary },
  labelSelected: { color: colors.accent },
});
