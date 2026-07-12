import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, hitSlop, spacing, type } from '../theme';

interface Props {
  title: string;
  action?: { label: string; onPress: () => void };
}

export function SectionHeader({ title, action }: Props) {
  return (
    <View style={styles.row}>
      <Text style={type.heading} accessibilityRole="header">
        {title}
      </Text>
      {action ? (
        <Pressable
          onPress={action.onPress}
          hitSlop={hitSlop}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <Text style={styles.action}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  action: { ...type.bodyStrong, color: colors.accent },
});
