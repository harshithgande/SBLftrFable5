import { Ionicons } from '@expo/vector-icons';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { BodyDiagram, statusFor } from '../components/BodyDiagram';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { RingProgress } from '../components/RingProgress';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { Sheet } from '../components/Sheet';
import { Stepper } from '../components/Stepper';
import { TextField } from '../components/TextField';
import { useApp } from '../context/AppContext';
import { exerciseName } from '../data/exercises';
import { WORKOUT_TYPE_NAMES } from '../data/workoutPools';
import { RootStackParamList, TabParamList } from '../navigation/types';
import { colors, radii, spacing, type } from '../theme';
import { ActiveWorkout, MuscleGroup, WorkoutType } from '../types';
import { dateKey, greetingForHour, simulatedNow, slotForDate } from '../utils/date';
import { MuscleRecovery, recoveryByMuscle, RECOVERY_WINDOW_HOURS } from '../utils/recovery';
import { weekStreak, workoutsInWeekOf } from '../utils/streak';
import { parseNumericInput } from '../utils/units';
import { uid } from '../utils/id';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Today'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function TodayScreen({ navigation }: Props) {
  const { state, dispatch } = useApp();

  // Reset yesterday's goal counters whenever this screen regains focus.
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      dispatch({ type: 'ENSURE_GOALS_FRESH' });
    });
    return unsubscribe;
  }, [navigation, dispatch]);

  const { width } = useWindowDimensions();
  const [targetsOpen, setTargetsOpen] = useState(false);
  const [recoveryInfoOpen, setRecoveryInfoOpen] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [waterTarget, setWaterTarget] = useState(`${state.goalTargets.water}`);
  const [stepsTarget, setStepsTarget] = useState(`${state.goalTargets.steps}`);
  const [caloriesTarget, setCaloriesTarget] = useState(`${state.goalTargets.calories}`);

  const now = simulatedNow(state.devOffset);
  const todaySlot = slotForDate(state.schedule, now);
  const workout = todaySlot !== 'rest' ? state.workouts[todaySlot] : null;
  const firstName = (state.user ?? 'lifter').split(' ')[0];

  const trainedToday = state.history.some((h) => dateKey(new Date(h.dateISO)) === dateKey(now));
  const target = state.frequency ?? 4;
  const doneThisWeek = workoutsInWeekOf(state.history, now);
  const streak = weekStreak(state.history, target, now);
  const recovery = useMemo(() => recoveryByMuscle(state.history, now), [state.history, now]);

  const startWorkout = (type: WorkoutType) => {
    if (state.activeWorkout) {
      navigation.navigate('ActiveWorkout');
      return;
    }
    const def = state.workouts[type];
    if (!def) return;
    const active: ActiveWorkout = {
      id: uid(),
      type,
      name: def.name,
      startedAt: new Date().toISOString(),
      exercises: def.exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        name: exerciseName(ex.exerciseId),
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

  const saveTargets = () => {
    const water = parseNumericInput(waterTarget);
    const steps = parseNumericInput(stepsTarget);
    const calories = parseNumericInput(caloriesTarget);
    dispatch({
      type: 'SET_GOAL_TARGETS',
      targets: {
        ...(water !== null && water > 0 ? { water: Math.round(water) } : {}),
        ...(steps !== null && steps > 0 ? { steps: Math.round(steps) } : {}),
        ...(calories !== null && calories > 0 ? { calories: Math.round(calories) } : {}),
      },
    });
    setTargetsOpen(false);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={type.body}>{greetingForHour(now.getHours())},</Text>
          <Text style={type.title}>{firstName}</Text>
        </View>
        <RingProgress
          progress={target > 0 ? doneThisWeek / target : 0}
          size={72}
          strokeWidth={7}
          centerLabel={`${doneThisWeek}/${target}`}
          accessibilityLabel={`${doneThisWeek} of ${target} workouts done this week`}
        />
      </View>

      {streak > 0 ? (
        <View style={styles.streakRow}>
          <Ionicons name="flame" size={16} color={colors.warning} />
          <Text style={[type.caption, { color: colors.warning }]}>
            {streak} week{streak === 1 ? '' : 's'} on target — keep the run alive
          </Text>
        </View>
      ) : null}

      <SectionHeader title="Today's session" />
      {workout ? (
        <Card raised>
          <View style={styles.workoutHeader}>
            <View style={styles.workoutBadge}>
              <Ionicons name="barbell-outline" size={22} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={type.heading}>{WORKOUT_TYPE_NAMES[workout.type]}</Text>
              <Text style={type.caption}>
                {workout.exercises.length} exercises ·{' '}
                {workout.exercises.reduce((s, e) => s + e.sets, 0)} working sets
              </Text>
            </View>
          </View>
          <Text style={[type.body, { marginTop: spacing.md }]} numberOfLines={2}>
            {workout.exercises
              .slice(0, 3)
              .map((e) => exerciseName(e.exerciseId))
              .join(' · ')}
            {workout.exercises.length > 3 ? `  +${workout.exercises.length - 3} more` : ''}
          </Text>
          {trainedToday && !state.activeWorkout ? (
            <View style={styles.doneRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={[type.bodyStrong, { color: colors.success }]}>Logged today — nice work</Text>
            </View>
          ) : (
            <Button
              label={state.activeWorkout ? 'Resume workout' : 'Start workout'}
              onPress={() => startWorkout(workout.type)}
              style={{ marginTop: spacing.lg }}
            />
          )}
        </Card>
      ) : (
        <Card>
          <View style={styles.workoutHeader}>
            <View style={[styles.workoutBadge, { backgroundColor: colors.infoDim }]}>
              <Ionicons name="moon-outline" size={22} color={colors.info} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={type.heading}>Rest day</Text>
              <Text style={type.caption}>Recovery is where the growth happens.</Text>
            </View>
          </View>
          {state.activeWorkout ? (
            <Button label="Resume workout" onPress={() => navigation.navigate('ActiveWorkout')} style={{ marginTop: spacing.lg }} />
          ) : null}
        </Card>
      )}

      <SectionHeader title="Daily goals" action={{ label: 'Edit targets', onPress: () => setTargetsOpen(true) }} />
      <Card>
        <Stepper
          label={`Water · ${state.goals.water}/${state.goalTargets.water} glasses`}
          value={`${state.goals.water}`}
          onIncrement={() => dispatch({ type: 'ADD_WATER', delta: 1 })}
          onDecrement={() => dispatch({ type: 'ADD_WATER', delta: -1 })}
        />
        <View style={styles.divider} />
        <GoalToggle
          label={`Steps · ${state.goalTargets.steps.toLocaleString()} target`}
          done={state.goals.steps}
          onToggle={() => dispatch({ type: 'TOGGLE_GOAL', goal: 'steps' })}
        />
        <View style={styles.divider} />
        <GoalToggle
          label={`Calories · ${state.goalTargets.calories.toLocaleString()} kcal target`}
          done={state.goals.calories}
          onToggle={() => dispatch({ type: 'TOGGLE_GOAL', goal: 'calories' })}
        />
      </Card>

      <SectionHeader
        title="Muscle recovery"
        action={{ label: 'What is this?', onPress: () => setRecoveryInfoOpen(true) }}
      />
      <Card>
        {recovery.size === 0 ? (
          <Text style={[type.caption, { marginBottom: spacing.md }]}>
            Nothing logged in the last week, so every muscle group is fresh — the map fills in as
            you train.
          </Text>
        ) : null}
        <BodyDiagram
          recovery={recovery}
          selected={selectedMuscle}
          onSelect={(m) => setSelectedMuscle((prev) => (prev === m ? null : m))}
          width={width - spacing.xl * 2 - spacing.lg * 2}
        />
        <View style={styles.legendRow}>
          <LegendItem color={colors.success} label="Ready" />
          <LegendItem color={colors.danger} label="Needs rest" hatched />
          <LegendItem color={colors.borderStrong} label="No recent data" />
        </View>
        <View style={styles.recoveryDetail} accessibilityLiveRegion="polite">
          {selectedMuscle ? (
            <RecoveryDetail muscle={selectedMuscle} entry={recovery.get(selectedMuscle)} />
          ) : (
            <Text style={type.caption}>Tap a muscle on the map to see its status.</Text>
          )}
        </View>
      </Card>

      {!state.premium ? (
        <Card
          onPress={() => navigation.navigate('Paywall', { source: 'upgrade' })}
          accessibilityLabel="See Premium options"
          style={styles.upgradeCard}
        >
          <View style={styles.upgradeRow}>
            <Ionicons name="star" size={18} color={colors.premium} />
            <View style={{ flex: 1 }}>
              <Text style={type.bodyStrong}>Get your personalized split</Text>
              <Text style={type.caption}>Premium matches your week to your goal and schedule.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </View>
        </Card>
      ) : null}

      <Sheet visible={targetsOpen} title="Edit daily targets" onClose={() => setTargetsOpen(false)}>
        <TextField label="Water (glasses)" value={waterTarget} onChangeText={setWaterTarget} keyboardType="number-pad" />
        <TextField
          label="Steps"
          value={stepsTarget}
          onChangeText={setStepsTarget}
          keyboardType="number-pad"
          style={{ marginTop: spacing.lg }}
        />
        <TextField
          label="Calories (kcal)"
          value={caloriesTarget}
          onChangeText={setCaloriesTarget}
          keyboardType="number-pad"
          style={{ marginTop: spacing.lg }}
        />
        <Button label="Save targets" onPress={saveTargets} style={{ marginTop: spacing.xl }} />
      </Sheet>

      <Sheet visible={recoveryInfoOpen} title="How the recovery map works" onClose={() => setRecoveryInfoOpen(false)}>
        <Text style={type.body}>
          This is a simple, transparent rule of thumb — not a medical measurement. A muscle group
          shows red with hatching (“Needs rest”) for {RECOVERY_WINDOW_HOURS} hours after you last
          trained it, then green (“Ready”). Muscles with no sessions in the past week stay muted —
          no data, which usually just means they’re fresh. Tap any muscle for details. Use the map
          as a nudge, and listen to your body first.
        </Text>
        <Button label="Got it" onPress={() => setRecoveryInfoOpen(false)} variant="secondary" style={{ marginTop: spacing.xl }} />
      </Sheet>
    </Screen>
  );
}

function GoalToggle({ label, done, onToggle }: { label: string; done: boolean; onToggle: () => void }) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.goalToggle, pressed ? { opacity: 0.8 } : null]}
    >
      <Text style={[type.bodyStrong, done ? { color: colors.success } : null, { flex: 1 }]}>{label}</Text>
      <Ionicons
        name={done ? 'checkmark-circle' : 'ellipse-outline'}
        size={26}
        color={done ? colors.success : colors.border}
      />
    </Pressable>
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function LegendItem({ color, label, hatched = false }: { color: string; label: string; hatched?: boolean }) {
  return (
    <View style={styles.legendItem} accessibilityLabel={`${label} legend color`}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]}>
        {hatched ? <View style={styles.legendHatch} /> : null}
      </View>
      <Text style={type.caption}>{label}</Text>
    </View>
  );
}

function RecoveryDetail({ muscle, entry }: { muscle: MuscleGroup; entry: MuscleRecovery | undefined }) {
  const status = statusFor(entry);
  const icon =
    status === 'ready' ? 'checkmark-circle' : status === 'recovering' ? 'time' : 'ellipse-outline';
  const color =
    status === 'ready' ? colors.success : status === 'recovering' ? colors.danger : colors.textTertiary;
  const statusText =
    status === 'ready' ? 'Ready to train' : status === 'recovering' ? 'Needs rest' : 'No recent training';
  const detail = entry
    ? entry.hoursSince < 1
      ? 'Trained under an hour ago'
      : `Trained ${Math.round(entry.hoursSince)}h ago`
    : 'No sessions in the last 7 days';

  return (
    <View style={styles.recoveryDetailRow}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[type.bodyStrong, { flex: 1 }]}>{capitalize(muscle)}</Text>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[type.bodyStrong, { color }]}>{statusText}</Text>
        <Text style={type.caption}>{detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  headerText: { flex: 1, marginRight: spacing.md },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  workoutHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  workoutBadge: {
    width: 46,
    height: 46,
    borderRadius: radii.md,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.md },
  goalToggle: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendSwatch: {
    width: 14,
    height: 14,
    borderRadius: 4,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendHatch: {
    width: 20,
    height: 2,
    backgroundColor: colors.bg,
    opacity: 0.55,
    transform: [{ rotate: '45deg' }],
  },
  recoveryDetail: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    minHeight: 40,
    justifyContent: 'center',
  },
  recoveryDetailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  upgradeCard: { marginTop: spacing.xl, borderColor: colors.premiumDim },
  upgradeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
