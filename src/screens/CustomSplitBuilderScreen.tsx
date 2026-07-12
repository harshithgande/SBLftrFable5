import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { PremiumGate } from '../components/Premium';
import { Screen } from '../components/Screen';
import { TextField } from '../components/TextField';
import { WeekStrip } from '../components/WeekStrip';
import { useApp } from '../context/AppContext';
import { DAYS_IN_WEEK } from '../data/splits';
import { WORKOUT_TYPE_NAMES } from '../data/workoutPools';
import { RootScreenProps } from '../navigation/types';
import { colors, spacing, type } from '../theme';
import { CustomSplitDay, DaySlot } from '../types';
import { dayName } from '../utils/date';
import { uid } from '../utils/id';

const SLOT_OPTIONS: DaySlot[] = ['upper', 'lower', 'push', 'pull', 'full', 'rest'];

function slotLabel(slot: DaySlot): string {
  return slot === 'rest' ? 'Rest' : WORKOUT_TYPE_NAMES[slot];
}

export function CustomSplitBuilderScreen({ navigation, route }: RootScreenProps<'CustomSplitBuilder'>) {
  const { state, dispatch } = useApp();
  const editing = route.params?.editId ? state.customSplits.find((s) => s.id === route.params?.editId) : undefined;

  const [name, setName] = useState(editing?.name ?? '');
  const [days, setDays] = useState<CustomSplitDay[]>(
    editing?.days ??
      Array.from({ length: DAYS_IN_WEEK }, (_, i) => ({ name: dayName(i), type: 'rest' as DaySlot }))
  );
  const [error, setError] = useState<string | null>(null);

  const setDayType = (index: number, slot: DaySlot) => {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, type: slot } : d)));
    setError(null);
  };

  const setDayName = (index: number, text: string) => {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, name: text } : d)));
  };

  const save = (activate: boolean) => {
    if (name.trim() === '') {
      setError('Give your split a name.');
      return;
    }
    if (days.length !== DAYS_IN_WEEK) {
      setError('A split must cover exactly seven days.');
      return;
    }
    if (!days.some((d) => d.type !== 'rest')) {
      setError('Add at least one training day.');
      return;
    }
    const split = {
      id: editing?.id ?? uid(),
      name: name.trim(),
      days: days.map((d, i) => ({ name: d.name.trim() === '' ? dayName(i) : d.name.trim(), type: d.type })),
    };
    dispatch({ type: 'SAVE_CUSTOM_SPLIT', split });
    if (activate) {
      dispatch({
        type: 'SELECT_SPLIT',
        splitId: `custom:${split.id}`,
        schedule: split.days.map((d) => d.type),
      });
    }
    navigation.goBack();
  };

  const trainingDays = days.filter((d) => d.type !== 'rest').length;

  return (
    <Screen
      footer={
        <PremiumGate
          feature="custom-split-builder"
          premium={state.premium}
          onUpgrade={() => navigation.navigate('Paywall', { source: 'upgrade' })}
          lockedMessage="Building custom splits is a Premium feature."
        >
          <View>
            {error ? (
              <Text style={[type.caption, styles.error]} accessibilityLiveRegion="polite">
                {error}
              </Text>
            ) : null}
            <Button label="Save and activate" onPress={() => save(true)} />
            <Button label="Save only" onPress={() => save(false)} variant="secondary" style={{ marginTop: spacing.sm }} />
          </View>
        </PremiumGate>
      }
    >
      <PremiumGate
        feature="custom-split-builder"
        premium={state.premium}
        onUpgrade={() => navigation.navigate('Paywall', { source: 'upgrade' })}
        lockedMessage="Design your own seven-day week: name each day, assign workout types and rest days, and switch between saved splits."
      >
        <View style={styles.header}>
          <Text style={type.title}>{editing ? 'Edit split' : 'Build your week'}</Text>
          <Text style={[type.body, { marginTop: spacing.xs }]}>
            Assign a workout or rest to each of the seven days. {trainingDays} training day
            {trainingDays === 1 ? '' : 's'} so far.
          </Text>
        </View>

        <TextField
          label="Split name"
          value={name}
          onChangeText={(t) => {
            setName(t);
            setError(null);
          }}
          placeholder="e.g. My Push Pull Week"
          maxLength={30}
        />

        <Card style={{ marginTop: spacing.lg }}>
          <Text style={[type.label, { marginBottom: spacing.md }]}>Week preview</Text>
          <WeekStrip schedule={days.map((d) => d.type)} />
        </Card>

        {days.map((day, index) => (
          <Card key={`day-${index}`} style={styles.dayCard}>
            <TextField
              label={`Day ${index + 1} · ${dayName(index)}`}
              value={day.name}
              onChangeText={(t) => setDayName(index, t)}
              placeholder={dayName(index)}
              maxLength={20}
            />
            <View style={styles.slotRow}>
              {SLOT_OPTIONS.map((slot) => (
                <Chip
                  key={slot}
                  label={slotLabel(slot)}
                  selected={day.type === slot}
                  onPress={() => setDayType(index, slot)}
                  accessibilityHint={`Sets day ${index + 1} to ${slotLabel(slot)}`}
                />
              ))}
            </View>
          </Card>
        ))}
      </PremiumGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.md, marginBottom: spacing.lg },
  dayCard: { marginTop: spacing.md },
  slotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  error: { color: colors.danger, marginBottom: spacing.sm },
});
