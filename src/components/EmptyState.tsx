import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, type } from '../theme';
import { Button } from './Button';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ icon, title, message, action }: Props) {
  return (
    <View style={styles.wrap} accessibilityRole="summary" accessibilityLabel={`${title}. ${message}`}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={30} color={colors.textTertiary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {action ? (
        <Button label={action.label} onPress={action.onPress} variant="secondary" size="medium" style={styles.button} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...type.subheading, marginBottom: spacing.xs, textAlign: 'center' },
  message: { ...type.body, textAlign: 'center', maxWidth: 280 },
  button: { marginTop: spacing.lg },
});
