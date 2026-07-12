import { Ionicons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../components/Card';
import { PremiumBadge, PremiumGate } from '../components/Premium';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { WeekStrip } from '../components/WeekStrip';
import { useApp } from '../context/AppContext';
import { exerciseName } from '../data/exercises';
import { CLASSIC_SPLIT_IDS, SPLITS } from '../data/splits';
import { WORKOUT_TYPE_NAMES } from '../data/workoutPools';
import { RootStackParamList, TabParamList } from '../navigation/types';
import { colors, radii, spacing, type } from '../theme';
import { DaySlot, WorkoutType } from '../types';
import { confirmDestructive } from '../utils/confirm';
import { mondayIndex, simulatedNow } from '../utils/date';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Plan'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function PlanScreen({ navigation }: Props) {
  const { state, dispatch } = useApp();
  const now = simulatedNow(state.devOffset);
  const todayIdx = mondayIndex(now);

  const activeTypes = uniqueTypes(state.schedule);
  const personalizedSplit = state.personalizedSplitId ? SPLITS[state.personalizedSplitId] : null;
  const activeSplitName =
    state.split.startsWith('custom:') && findCustom(state)
      ? findCustom(state)?.name ?? 'Custom split'
      : SPLITS[state.split]?.name ?? 'Training split';

  const selectBuiltIn = (id: string) => {
    const split = SPLITS[id];
    if (!split) return;
    dispatch({ type: 'SELECT_SPLIT', splitId: id, schedule: split.schedule });
  };

  const selectCustom = (id: string) => {
    const custom = state.customSplits.find((c) => c.id === id);
    if (!custom) return;
    dispatch({
      type: 'SELECT_SPLIT',
      splitId: `custom:${id}`,
      schedule: custom.days.map((d) => d.type),
    });
  };

  const deleteCustom = (id: string, name: string) => {
    confirmDestructive({
      title: 'Delete custom split?',
      message: `“${name}” will be removed. If it's your active schedule, you'll switch back to the standard split.`,
      confirmLabel: 'Delete',
      onConfirm: () => {
        dispatch({ type: 'DELETE_CUSTOM_SPLIT', id });
        if (state.split === `custom:${id}`) {
          const fallbackId = state.personalizedSplitId ?? (state.frequency !== null && state.frequency >= 5 ? 'ppl' : 'ul');
          selectBuiltIn(fallbackId);
        }
      },
    });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={type.title}>Training plan</Text>
        <Text style={[type.body, { marginTop: spacing.xs }]}>{activeSplitName}</Text>
      </View>

      <Card raised>
        <Text style={[type.label, { marginBottom: spacing.md }]}>This week</Text>
        <WeekStrip schedule={state.schedule} todayIndex={todayIdx} />
      </Card>

      <SectionHeader title="Workouts in your week" />
      {activeTypes.map((t) => {
        const def = state.workouts[t];
        if (!def) return null;
        return (
          <Card
            key={t}
            onPress={() => navigation.navigate('WorkoutDetail', { type: t })}
            accessibilityLabel={`${WORKOUT_TYPE_NAMES[t]} workout, ${def.exercises.length} exercises`}
            accessibilityHint="Shows the exercise list"
            style={styles.workoutCard}
          >
            <View style={styles.workoutRow}>
              <View style={styles.workoutBadge}>
                <Text style={styles.workoutBadgeText}>{WORKOUT_TYPE_NAMES[t].charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={type.subheading}>{WORKOUT_TYPE_NAMES[t]}</Text>
                <Text style={type.caption} numberOfLines={1}>
                  {def.exercises
                    .slice(0, 3)
                    .map((e) => exerciseName(e.exerciseId))
                    .join(' · ')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </View>
          </Card>
        );
      })}

      <SectionHeader title="Choose your split" />
      {personalizedSplit ? (
        <SplitRow
          name="My Plan"
          description={`${personalizedSplit.name} — assigned from your goal, experience and ${personalizedSplit.daysPerWeek}-day schedule.`}
          schedule={personalizedSplit.schedule}
          active={state.split === personalizedSplit.id}
          badge={<PremiumBadge />}
          onPress={() => selectBuiltIn(personalizedSplit.id)}
        />
      ) : null}
      {CLASSIC_SPLIT_IDS.map((id) => (
        <SplitRow
          key={id}
          name={SPLITS[id].name}
          description={SPLITS[id].description}
          schedule={SPLITS[id].schedule}
          active={state.split === id}
          onPress={() => selectBuiltIn(id)}
        />
      ))}

      {state.customSplits.map((custom) => (
        <SplitRow
          key={custom.id}
          name={custom.name}
          description="Your custom seven-day schedule."
          schedule={custom.days.map((d) => d.type)}
          active={state.split === `custom:${custom.id}`}
          onPress={() => selectCustom(custom.id)}
          onEdit={() => navigation.navigate('CustomSplitBuilder', { editId: custom.id })}
          onDelete={() => deleteCustom(custom.id, custom.name)}
        />
      ))}

      <View style={{ marginTop: spacing.lg }}>
        <PremiumGate
          feature="custom-split-builder"
          premium={state.premium}
          onUpgrade={() => navigation.navigate('Paywall', { source: 'upgrade' })}
          lockedMessage="Design your own seven-day week: name each day, assign workout types and rest days, and switch between saved splits."
        >
          <Card
            onPress={() => navigation.navigate('CustomSplitBuilder', undefined)}
            accessibilityLabel="Create a custom split"
            style={styles.builderCard}
          >
            <View style={styles.workoutRow}>
              <View style={[styles.workoutBadge, { backgroundColor: colors.surfaceRaised }]}>
                <Ionicons name="add" size={22} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={type.subheading}>Build a custom split</Text>
                <Text style={type.caption}>Name it, set all seven days, save and activate.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </View>
          </Card>
        </PremiumGate>
      </View>
    </Screen>
  );
}

interface SplitRowProps {
  name: string;
  description: string;
  schedule: DaySlot[];
  active: boolean;
  badge?: React.ReactNode;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function SplitRow({ name, description, schedule, active, badge, onPress, onEdit, onDelete }: SplitRowProps) {
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`${name}${active ? ', active' : ''}`}
      accessibilityHint={active ? undefined : 'Makes this your active schedule'}
      style={[styles.splitRow, active ? styles.splitActive : null] as never}
    >
      <View style={styles.splitHeader}>
        <Text style={[type.subheading, { flex: 1 }]}>{name}</Text>
        {badge}
        {active ? (
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>ACTIVE</Text>
          </View>
        ) : null}
      </View>
      <Text style={[type.caption, { marginTop: spacing.xs, marginBottom: spacing.md }]}>{description}</Text>
      <WeekStrip schedule={schedule} />
      {onEdit || onDelete ? (
        <View style={styles.customActions}>
          {onEdit ? (
            <Text style={styles.customAction} onPress={onEdit} accessibilityRole="button">
              Edit
            </Text>
          ) : null}
          {onDelete ? (
            <Text style={[styles.customAction, { color: colors.danger }]} onPress={onDelete} accessibilityRole="button">
              Delete
            </Text>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

function uniqueTypes(schedule: DaySlot[]): WorkoutType[] {
  const seen: WorkoutType[] = [];
  for (const slot of schedule) {
    if (slot !== 'rest' && !seen.includes(slot)) seen.push(slot);
  }
  return seen;
}

function findCustom(state: { split: string; customSplits: { id: string; name: string }[] }) {
  const id = state.split.replace('custom:', '');
  return state.customSplits.find((c) => c.id === id) ?? null;
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.lg, marginBottom: spacing.lg },
  workoutCard: { marginBottom: spacing.md },
  workoutRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  workoutBadge: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutBadgeText: { ...type.subheading, color: colors.accent },
  splitRow: { marginBottom: spacing.md },
  splitActive: { borderColor: colors.accent },
  splitHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  activePill: {
    backgroundColor: colors.accentDim,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  activePillText: { ...type.label, color: colors.accent, fontSize: 10, letterSpacing: 0.5 },
  customActions: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.md },
  customAction: { ...type.bodyStrong, color: colors.accent, paddingVertical: spacing.xs },
  builderCard: { borderStyle: 'dashed' },
});
