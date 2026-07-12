import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { useApp } from '../context/AppContext';
import { getExercise } from '../data/exercises';
import { WORKOUT_TYPE_NAMES } from '../data/workoutPools';
import { RootScreenProps } from '../navigation/types';
import { colors, radii, spacing, type } from '../theme';
import { ActiveWorkout } from '../types';
import { uid } from '../utils/id';

export function WorkoutDetailScreen({ navigation, route }: RootScreenProps<'WorkoutDetail'>) {
  const { state, dispatch } = useApp();
  const def = state.workouts[route.params.type];

  if (!def) {
    return (
      <Screen scroll={false} contentStyle={styles.missing}>
        <Text style={type.body}>This workout isn’t available.</Text>
      </Screen>
    );
  }

  const totalSets = def.exercises.reduce((s, e) => s + e.sets, 0);

  const start = () => {
    if (state.activeWorkout) {
      navigation.navigate('ActiveWorkout');
      return;
    }
    const active: ActiveWorkout = {
      id: uid(),
      type: def.type,
      name: def.name,
      startedAt: new Date().toISOString(),
      exercises: def.exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        name: getExercise(ex.exerciseId).name,
        sets: Array.from({ length: ex.sets }, (_, i) => ({
          id: `${ex.exerciseId}-${i}`,
          weightLbs: 0,
          reps: 0,
          completed: false,
        })),
      })),
    };
    dispatch({ type: 'START_WORKOUT', workout: active });
    navigation.navigate('ActiveWorkout');
  };

  return (
    <Screen footer={<Button label={state.activeWorkout ? 'Resume active workout' : 'Start this workout'} onPress={start} />}>
      <View style={styles.header}>
        <Text style={type.title}>{WORKOUT_TYPE_NAMES[def.type]}</Text>
        <Text style={[type.body, { marginTop: spacing.xs }]}>
          {def.exercises.length} exercises · {totalSets} working sets · ordered for your goal
        </Text>
      </View>
      {def.exercises.map((ex, index) => {
        const info = getExercise(ex.exerciseId);
        return (
          <Card key={ex.exerciseId} style={styles.exerciseCard}>
            <View style={styles.exerciseRow}>
              <View style={styles.indexBadge}>
                <Text style={styles.indexText}>{index + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={type.subheading}>{info.name}</Text>
                <Text style={type.caption}>{info.muscles.join(' · ')}</Text>
              </View>
              <View style={styles.setsBadge}>
                <Text style={styles.setsText}>
                  {ex.sets} set{ex.sets === 1 ? '' : 's'}
                </Text>
              </View>
            </View>
          </Card>
        );
      })}
      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={16} color={colors.textTertiary} />
        <Text style={[type.caption, { flex: 1 }]}>
          Exercises with more sets are your priority work and come first while you’re fresh. You can
          add or remove sets during the workout.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  missing: { alignItems: 'center', justifyContent: 'center' },
  header: { marginTop: spacing.md, marginBottom: spacing.lg },
  exerciseCard: { marginBottom: spacing.sm, paddingVertical: spacing.md },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  indexBadge: {
    width: 30,
    height: 30,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: { ...type.caption, color: colors.textSecondary, fontWeight: '700' },
  setsBadge: {
    backgroundColor: colors.accentDim,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  setsText: { ...type.caption, color: colors.accent, fontWeight: '700' },
  note: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, alignItems: 'flex-start' },
});
