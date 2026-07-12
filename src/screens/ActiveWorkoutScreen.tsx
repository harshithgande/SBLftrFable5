import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useApp } from '../context/AppContext';
import { useRestTimer } from '../hooks/useRestTimer';
import { RootScreenProps } from '../navigation/types';
import { colors, hitSlop, radii, spacing, type } from '../theme';
import { HistoryExercise, HistoryItem, PRRecord } from '../types';
import { confirmDestructive } from '../utils/confirm';
import { formatDuration, simulatedNow } from '../utils/date';
import { collectBests, detectPRs, epley1RM, lastPerformance, prLabel } from '../utils/pr';
import { uid } from '../utils/id';
import { formatWeight, fromDisplayWeight, parseNumericInput, toDisplayWeight } from '../utils/units';
import { workoutVolumeLbs } from '../utils/volume';

/**
 * Active workout logging, optimized for one-handed use between sets:
 * big inputs, one-tap set completion that saves values and auto-starts the
 * rest timer, previous-performance hints, and inline PR feedback.
 */

interface DraftValues {
  weight: string;
  reps: string;
}

export function ActiveWorkoutScreen({ navigation }: RootScreenProps<'ActiveWorkout'>) {
  const { state, dispatch } = useApp();
  const workout = state.activeWorkout;
  const units = state.units;

  // Draft input text per set id — committed to state when the set is completed,
  // so typing never mutates saved data and completion never wipes input.
  const [drafts, setDrafts] = useState<Record<string, DraftValues>>({});
  const [prFlash, setPrFlash] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const sessionPRs = useRef<PRRecord[]>([]);
  const prTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const restTimer = useRestTimer();

  // Previous bests per exercise, computed once from history at mount.
  const bests = useMemo(() => {
    if (!workout) return new Map<string, ReturnType<typeof collectBests>>();
    const map = new Map<string, ReturnType<typeof collectBests>>();
    for (const ex of workout.exercises) {
      map.set(ex.exerciseId, collectBests(state.history, ex.exerciseId));
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workout?.id]);

  useEffect(() => {
    if (!workout) return;
    const started = new Date(workout.startedAt).getTime();
    const tick = setInterval(() => setElapsed(Math.max(0, Math.floor((Date.now() - started) / 1000))), 1000);
    return () => clearInterval(tick);
  }, [workout]);

  useEffect(() => () => {
    if (prTimer.current) clearTimeout(prTimer.current);
  }, []);

  if (!workout) {
    // Session was finished/discarded (or cleared by a restart) — leave quietly.
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.emptyWrap}>
          <Text style={type.body}>No workout in progress.</Text>
          <Button label="Go back" onPress={() => navigation.goBack()} variant="secondary" style={{ marginTop: spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  const draftFor = (setId: string, weightLbs: number, reps: number): DraftValues => {
    const existing = drafts[setId];
    if (existing) return existing;
    return {
      weight: weightLbs > 0 ? `${toDisplayWeight(weightLbs, units)}` : '',
      reps: reps > 0 ? `${reps}` : '',
    };
  };

  const setDraft = (setId: string, patch: Partial<DraftValues>, weightLbs: number, reps: number) => {
    setDrafts((prev) => ({ ...prev, [setId]: { ...draftFor(setId, weightLbs, reps), ...patch } }));
  };

  const completeSet = (exerciseIndex: number, setIndex: number) => {
    const exercise = workout.exercises[exerciseIndex];
    const set = exercise.sets[setIndex];

    if (set.completed) {
      dispatch({ type: 'UPDATE_SET', exerciseIndex, setIndex, patch: { completed: false } });
      return;
    }

    const draft = draftFor(set.id, set.weightLbs, set.reps);
    const weightValue = parseNumericInput(draft.weight);
    const repsValue = parseNumericInput(draft.reps);
    if (weightValue === null || repsValue === null || repsValue < 1) {
      setPrFlash('Enter a weight and reps to finish the set');
      schedulePrClear();
      return;
    }

    const weightLbs = fromDisplayWeight(weightValue, units);
    const reps = Math.round(repsValue);
    dispatch({
      type: 'UPDATE_SET',
      exerciseIndex,
      setIndex,
      patch: { weightLbs, reps, completed: true },
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    restTimer.start(state.restDefault);

    const exerciseBests = bests.get(exercise.exerciseId);
    if (exerciseBests) {
      const kinds = detectPRs(exerciseBests, weightLbs, reps);
      if (kinds.length > 0) {
        for (const kind of kinds) {
          sessionPRs.current.push({
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.name,
            kind,
            weightLbs,
            reps,
          });
        }
        // Update in-session bests so a later set must beat THIS one.
        exerciseBests.maxWeight = Math.max(exerciseBests.maxWeight, weightLbs);
        const prevReps = exerciseBests.repsAtWeight.get(weightLbs) ?? 0;
        if (reps > prevReps) exerciseBests.repsAtWeight.set(weightLbs, reps);
        exerciseBests.bestE1rm = Math.max(exerciseBests.bestE1rm, epley1RM(weightLbs, reps));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
        setPrFlash(`${prLabel(kinds[0])} — ${exercise.name}!`);
        schedulePrClear();
      }
    }
  };

  const schedulePrClear = () => {
    if (prTimer.current) clearTimeout(prTimer.current);
    prTimer.current = setTimeout(() => setPrFlash(null), 3200);
  };

  const finishWorkout = () => {
    const completedCount = workout.exercises.reduce(
      (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
      0
    );
    if (completedCount === 0) {
      confirmDestructive({
        title: 'Nothing logged yet',
        message: 'No sets are marked complete. Discard this workout?',
        confirmLabel: 'Discard',
        onConfirm: () => {
          dispatch({ type: 'CANCEL_WORKOUT' });
          navigation.goBack();
        },
      });
      return;
    }

    const exercises: HistoryExercise[] = workout.exercises
      .map((ex) => {
        const sets = ex.sets
          .filter((s) => s.completed && s.weightLbs > 0 && s.reps > 0)
          .map((s) => ({ weightLbs: s.weightLbs, reps: s.reps }));
        if (sets.length === 0) return null;
        const best = sets.reduce((a, b) => (epley1RM(b.weightLbs, b.reps) > epley1RM(a.weightLbs, a.reps) ? b : a));
        return {
          exerciseId: ex.exerciseId,
          name: ex.name,
          sets,
          bestWeightLbs: best.weightLbs,
          bestReps: best.reps,
        };
      })
      .filter((e): e is HistoryExercise => e !== null);

    const durationSec = Math.max(0, Math.floor((Date.now() - new Date(workout.startedAt).getTime()) / 1000));
    const item: HistoryItem = {
      id: uid(),
      dateISO: simulatedNow(state.devOffset).toISOString(),
      type: workout.type,
      name: workout.name,
      durationSec,
      totalVolumeLbs: workoutVolumeLbs(workout),
      exercises,
      prs: [...sessionPRs.current],
    };

    dispatch({ type: 'FINISH_WORKOUT', item });
    restTimer.skip();
    navigation.goBack();
  };

  const exitWorkout = () => {
    confirmDestructive({
      title: 'Leave workout?',
      message: 'Your session stays active — resume it from Today. Or discard it entirely.',
      confirmLabel: 'Discard workout',
      onConfirm: () => {
        dispatch({ type: 'CANCEL_WORKOUT' });
        navigation.goBack();
      },
    });
  };

  const completedSets = workout.exercises.reduce((s, ex) => s + ex.sets.filter((x) => x.completed).length, 0);
  const totalSets = workout.exercises.reduce((s, ex) => s + ex.sets.length, 0);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Minimize workout and go back"
        >
          <Ionicons name="chevron-down" size={26} color={colors.textSecondary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={type.subheading}>{workout.name}</Text>
          <Text style={[type.caption, { fontVariant: ['tabular-nums'] }]}>
            {formatDuration(elapsed)} · {completedSets}/{totalSets} sets
          </Text>
        </View>
        <Pressable
          onPress={exitWorkout}
          hitSlop={hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Discard workout"
        >
          <Ionicons name="trash-outline" size={22} color={colors.textTertiary} />
        </Pressable>
      </View>

      {prFlash ? (
        <View style={styles.prBanner} accessibilityLiveRegion="polite">
          <Ionicons name="trophy" size={16} color={colors.textInverse} />
          <Text style={styles.prText}>{prFlash}</Text>
        </View>
      ) : null}

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {workout.exercises.map((exercise, exerciseIndex) => {
            const last = lastPerformance(state.history, exercise.exerciseId);
            return (
              <Card key={exercise.exerciseId} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <Text style={[type.subheading, { flex: 1 }]}>{exercise.name}</Text>
                  {last ? (
                    <Text style={type.caption}>
                      Last: {formatWeight(last.weightLbs, units, false)}×{last.reps}
                    </Text>
                  ) : (
                    <Text style={type.caption}>First time</Text>
                  )}
                </View>

                <View style={styles.setHeaderRow}>
                  <Text style={[styles.setCol, type.label]}>Set</Text>
                  <Text style={[styles.inputCol, type.label]}>{units}</Text>
                  <Text style={[styles.inputCol, type.label]}>Reps</Text>
                  <View style={styles.doneCol} />
                  <View style={styles.removeCol} />
                </View>

                {exercise.sets.map((set, setIndex) => {
                  const draft = draftFor(set.id, set.weightLbs, set.reps);
                  return (
                    <View key={set.id} style={[styles.setRow, set.completed ? styles.setRowDone : null]}>
                      <Text style={[styles.setCol, type.bodyStrong]}>{setIndex + 1}</Text>
                      <TextInput
                        value={draft.weight}
                        onChangeText={(t) => setDraft(set.id, { weight: t }, set.weightLbs, set.reps)}
                        keyboardType="decimal-pad"
                        editable={!set.completed}
                        placeholder="0"
                        placeholderTextColor={colors.textTertiary}
                        style={[styles.input, styles.inputCol, set.completed ? styles.inputDone : null]}
                        accessibilityLabel={`${exercise.name} set ${setIndex + 1} weight in ${units}`}
                      />
                      <TextInput
                        value={draft.reps}
                        onChangeText={(t) => setDraft(set.id, { reps: t }, set.weightLbs, set.reps)}
                        keyboardType="number-pad"
                        editable={!set.completed}
                        placeholder="0"
                        placeholderTextColor={colors.textTertiary}
                        style={[styles.input, styles.inputCol, set.completed ? styles.inputDone : null]}
                        accessibilityLabel={`${exercise.name} set ${setIndex + 1} repetitions`}
                      />
                      <Pressable
                        onPress={() => completeSet(exerciseIndex, setIndex)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: set.completed }}
                        accessibilityLabel={`Mark ${exercise.name} set ${setIndex + 1} ${set.completed ? 'incomplete' : 'complete'}`}
                        style={[styles.doneButton, set.completed ? styles.doneButtonActive : null]}
                      >
                        <Ionicons
                          name="checkmark"
                          size={22}
                          color={set.completed ? colors.textInverse : colors.textSecondary}
                        />
                      </Pressable>
                      <Pressable
                        onPress={() => dispatch({ type: 'REMOVE_SET', exerciseIndex, setIndex })}
                        disabled={exercise.sets.length <= 1}
                        hitSlop={hitSlop}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${exercise.name} set ${setIndex + 1}`}
                        style={[styles.removeCol, { opacity: exercise.sets.length <= 1 ? 0.25 : 1 }]}
                      >
                        <Ionicons name="close" size={18} color={colors.textTertiary} />
                      </Pressable>
                    </View>
                  );
                })}

                <Pressable
                  onPress={() => dispatch({ type: 'ADD_SET', exerciseIndex })}
                  accessibilityRole="button"
                  accessibilityLabel={`Add a set to ${exercise.name}`}
                  style={styles.addSet}
                >
                  <Ionicons name="add" size={18} color={colors.accent} />
                  <Text style={[type.bodyStrong, { color: colors.accent }]}>Add set</Text>
                </Pressable>
              </Card>
            );
          })}
        </ScrollView>

        {restTimer.running ? (
          <View style={styles.restBar} accessibilityLiveRegion="polite">
            <View style={styles.restInfo}>
              <Ionicons name="timer-outline" size={20} color={colors.accent} />
              <Text style={styles.restTime}>{formatDuration(restTimer.remaining)}</Text>
              <Text style={type.caption}>rest</Text>
            </View>
            <View style={styles.restActions}>
              <Pressable
                onPress={() => restTimer.addSeconds(-15)}
                style={styles.restButton}
                accessibilityRole="button"
                accessibilityLabel="Shorten rest by 15 seconds"
              >
                <Text style={styles.restButtonText}>-15</Text>
              </Pressable>
              <Pressable
                onPress={() => restTimer.addSeconds(15)}
                style={styles.restButton}
                accessibilityRole="button"
                accessibilityLabel="Extend rest by 15 seconds"
              >
                <Text style={styles.restButtonText}>+15</Text>
              </Pressable>
              <Pressable
                onPress={restTimer.skip}
                style={[styles.restButton, { backgroundColor: colors.accent }]}
                accessibilityRole="button"
                accessibilityLabel="Skip rest"
              >
                <Text style={[styles.restButtonText, { color: colors.textInverse }]}>Skip</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.footer}>
          <Button label="Finish workout" onPress={finishWorkout} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  prBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    marginHorizontal: spacing.lg,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
  },
  prText: { ...type.bodyStrong, color: colors.textInverse },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  exerciseCard: { marginBottom: spacing.md },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm },
  setHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  setRowDone: { opacity: 0.75 },
  setCol: { width: 32, textAlign: 'center' },
  inputCol: { flex: 1, textAlign: 'center' },
  doneCol: { width: 44 },
  removeCol: { width: 28, alignItems: 'center' },
  input: {
    ...type.bodyStrong,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  inputDone: { backgroundColor: colors.successDim, color: colors.success },
  doneButton: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonActive: { backgroundColor: colors.success },
  addSet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    minHeight: 44,
  },
  restBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceRaised,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  restInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  restTime: { ...type.subheading, fontVariant: ['tabular-nums'], minWidth: 52 },
  restActions: { flexDirection: 'row', gap: spacing.sm },
  restButton: {
    minWidth: 48,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  restButtonText: { ...type.bodyStrong, color: colors.text },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
});
