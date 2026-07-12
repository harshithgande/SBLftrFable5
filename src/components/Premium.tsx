import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, type } from '../theme';
import { canUse, FEATURE_NAMES, FeatureKey } from '../utils/access';
import { Button } from './Button';
import { Card } from './Card';

export function PremiumBadge() {
  return (
    <View style={styles.badge} accessibilityLabel="Premium feature">
      <Ionicons name="star" size={10} color={colors.premium} />
      <Text style={styles.badgeText}>PRO</Text>
    </View>
  );
}

interface GateProps {
  feature: FeatureKey;
  premium: boolean;
  onUpgrade: () => void;
  children: ReactNode;
  /** Copy explaining what the locked feature does. */
  lockedMessage: string;
}

/**
 * Single reusable premium gate: renders children when allowed, otherwise a
 * consistent locked card with an upgrade path. All premium checks in screens
 * go through this (or utils/access) — never ad-hoc `state.premium` branches.
 */
export function PremiumGate({ feature, premium, onUpgrade, children, lockedMessage }: GateProps) {
  if (canUse(feature, premium)) return <>{children}</>;

  return (
    <Card>
      <View style={styles.lockedHeader}>
        <Ionicons name="lock-closed" size={16} color={colors.premium} />
        <Text style={styles.lockedTitle}>{FEATURE_NAMES[feature]}</Text>
        <PremiumBadge />
      </View>
      <Text style={[type.body, styles.lockedMessage]}>{lockedMessage}</Text>
      <Button label="See Premium options" onPress={onUpgrade} variant="secondary" size="medium" />
    </Card>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.premiumDim,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    gap: 3,
  },
  badgeText: { ...type.label, color: colors.premium, fontSize: 10, letterSpacing: 0.5 },
  lockedHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  lockedTitle: { ...type.subheading, flex: 1 },
  lockedMessage: { marginBottom: spacing.lg },
});
