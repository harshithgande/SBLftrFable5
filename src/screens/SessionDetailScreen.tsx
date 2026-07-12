import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { useApp } from '../context/AppContext';
import { RootScreenProps } from '../navigation/types';
import { colors, radii, spacing, type } from '../theme';
import { formatDuration, formatMediumDate } from '../utils/date';
import { prLabel } from '../utils/pr';
import { formatWeight } from '../utils/units';

export function SessionDetailScreen({ route }: RootScreenProps<'SessionDetail'>) {
  const { state } = useApp();
  const item = state.history.find((h) => h.id === route.params.id);

  if (!item) {
    return (
      <Screen scroll={false}>
        <EmptyState
          icon="alert-circle-outline"
          title="Session not found"
          message="This workout may have been deleted."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={type.title}>{item.name}</Text>
        <Text style={[type.body, { marginTop: spacing.xs }]}>{formatMediumDate(item.dateISO)}</Text>
        <View style={styles.statRow}>
          <Stat label="Volume" value={`${formatWeight(item.totalVolumeLbs, state.units, false)} ${state.units}`} />
          {item.durationSec !== null ? <Stat label="Duration" value={formatDuration(item.durationSec)} /> : null}
          <Stat label="Exercises" value={`${item.exercises.length}`} />
        </View>
      </View>

      {item.prs.length > 0 ? (
        <Card style={styles.prCard}>
          <View style={styles.prHeader}>
            <Ionicons name="trophy" size={18} color={colors.premium} />
            <Text style={[type.subheading, { color: colors.premium }]}>Personal records</Text>
          </View>
          {item.prs.map((pr, i) => (
            <Text key={`${pr.exerciseId}-${pr.kind}-${i}`} style={[type.body, { marginTop: spacing.xs }]}>
              {pr.exerciseName}: {prLabel(pr.kind)} — {formatWeight(pr.weightLbs, state.units, false)}
              {state.units}×{pr.reps}
            </Text>
          ))}
        </Card>
      ) : null}

      <SectionHeader title="Exercises" />
      {item.exercises.map((ex) => (
        <Card key={ex.exerciseId} style={styles.exerciseCard}>
          <Text style={type.subheading}>{ex.name}</Text>
          <Text style={[type.caption, { marginBottom: spacing.sm }]}>
            Best set: {formatWeight(ex.bestWeightLbs, state.units, false)}
            {state.units}×{ex.bestReps}
          </Text>
          {ex.sets.map((set, i) => (
            <View key={`${ex.exerciseId}-${i}`} style={styles.setRow}>
              <Text style={[type.caption, styles.setIndex]}>{i + 1}</Text>
              <Text style={type.body}>
                {formatWeight(set.weightLbs, state.units, false)} {state.units} × {set.reps} reps
              </Text>
            </View>
          ))}
        </Card>
      ))}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={type.label}>{label}</Text>
      <Text style={[type.subheading, { marginTop: 2 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.md },
  statRow: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.lg },
  stat: {},
  prCard: { marginTop: spacing.xl, borderColor: colors.premiumDim, backgroundColor: colors.premiumDim },
  prHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  exerciseCard: { marginBottom: spacing.md },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  setIndex: {
    width: 22,
    height: 22,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceRaised,
    textAlign: 'center',
    lineHeight: 22,
    overflow: 'hidden',
  },
});
