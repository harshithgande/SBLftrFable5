import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { WORKOUT_TYPE_ABBR } from '../data/workoutPools';
import { colors, radii, spacing, type } from '../theme';
import { DaySlot } from '../types';
import { dayAbbr } from '../utils/date';

interface Props {
  schedule: DaySlot[];
  /** Monday-first index to highlight as today; -1 for none. */
  todayIndex?: number;
}

/** Seven-day schedule overview with single-letter workout badges. */
export function WeekStrip({ schedule, todayIndex = -1 }: Props) {
  const summary = schedule
    .map((slot, i) => `${dayAbbr(i)}: ${slot === 'rest' ? 'rest' : slot}`)
    .join(', ');

  return (
    <View style={styles.row} accessibilityRole="text" accessibilityLabel={`Weekly schedule. ${summary}`}>
      {schedule.map((slot, i) => {
        const isToday = i === todayIndex;
        const isRest = slot === 'rest';
        return (
          <View key={`${i}-${slot}`} style={styles.day}>
            <Text style={[styles.dayLabel, isToday ? styles.todayLabel : null]}>{dayAbbr(i).charAt(0)}</Text>
            <View
              style={[
                styles.badge,
                isRest ? styles.badgeRest : styles.badgeWork,
                isToday ? styles.badgeToday : null,
              ]}
            >
              <Text style={[styles.badgeText, isRest ? styles.badgeTextRest : null]}>
                {WORKOUT_TYPE_ABBR[slot]}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', flex: 1 },
  dayLabel: { ...type.caption, marginBottom: spacing.xs },
  todayLabel: { color: colors.accent, fontWeight: '700' },
  badge: {
    minWidth: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeWork: { backgroundColor: colors.accentDim },
  badgeRest: { backgroundColor: colors.surface },
  badgeToday: { borderWidth: 1.5, borderColor: colors.accent },
  badgeText: { ...type.caption, color: colors.accent, fontWeight: '700' },
  badgeTextRest: { color: colors.textTertiary },
});
