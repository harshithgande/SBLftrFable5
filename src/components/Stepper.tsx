import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, tapTarget, type } from '../theme';

interface Props {
  label: string;
  value: string;
  onIncrement: () => void;
  onDecrement: () => void;
  incrementHint?: string;
  decrementHint?: string;
}

/** Accessible +/- numeric control with large tap targets. */
export function Stepper({ label, value, onIncrement, onDecrement, incrementHint, decrementHint }: Props) {
  return (
    <View style={styles.row}>
      <Text style={[type.bodyStrong, styles.label]}>{label}</Text>
      <View style={styles.controls}>
        <Pressable
          onPress={onDecrement}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          accessibilityHint={decrementHint}
          style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}
        >
          <Ionicons name="remove" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.value} accessibilityLabel={`${label}: ${value}`}>
          {value}
        </Text>
        <Pressable
          onPress={onIncrement}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          accessibilityHint={incrementHint}
          style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}
        >
          <Ionicons name="add" size={22} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { flex: 1, marginRight: spacing.md },
  controls: { flexDirection: 'row', alignItems: 'center' },
  button: {
    width: tapTarget,
    height: tapTarget,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  value: {
    ...type.subheading,
    minWidth: 76,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
