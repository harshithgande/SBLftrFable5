import { HistoryItem } from '../../types';
import { MS_PER_DAY } from '../date';
import { weekStreak, weekVolumeLbs, workoutsInWeekOf } from '../streak';

function workout(dateISO: string, volume = 1000): HistoryItem {
  return {
    id: dateISO,
    dateISO,
    type: 'upper',
    name: 'Upper',
    durationSec: 1800,
    totalVolumeLbs: volume,
    exercises: [],
    prs: [],
  };
}

function daysAgo(now: Date, days: number): string {
  return new Date(now.getTime() - days * MS_PER_DAY).toISOString();
}

describe('week streak', () => {
  const now = new Date(2026, 6, 8, 12, 0, 0); // Wednesday July 8

  it('is zero with no history', () => {
    expect(weekStreak([], 3, now)).toBe(0);
  });

  it('counts consecutive complete weeks and includes the current week once on target', () => {
    const history = [
      // Current week: 2 of 2.
      workout(daysAgo(now, 0)),
      workout(daysAgo(now, 1)),
      // Last week: 2.
      workout(daysAgo(now, 7)),
      workout(daysAgo(now, 8)),
      // Two weeks ago: 2.
      workout(daysAgo(now, 14)),
      workout(daysAgo(now, 15)),
    ];
    expect(weekStreak(history, 2, now)).toBe(3);
  });

  it('does not break the streak for an in-progress week below target', () => {
    const history = [
      workout(daysAgo(now, 1)), // current week: 1 of 2 (not counted, not broken)
      workout(daysAgo(now, 7)),
      workout(daysAgo(now, 8)),
    ];
    expect(weekStreak(history, 2, now)).toBe(1);
  });

  it('stops at the first missed week', () => {
    const history = [
      workout(daysAgo(now, 7)),
      workout(daysAgo(now, 8)),
      // gap two weeks ago
      workout(daysAgo(now, 21)),
      workout(daysAgo(now, 22)),
    ];
    expect(weekStreak(history, 2, now)).toBe(1);
  });
});

describe('weekly aggregates', () => {
  const now = new Date(2026, 6, 8, 12, 0, 0);

  it('counts only workouts in the same Monday-first week', () => {
    const history = [workout(daysAgo(now, 0)), workout(daysAgo(now, 2)), workout(daysAgo(now, 7))];
    expect(workoutsInWeekOf(history, now)).toBe(2);
  });

  it('sums weekly volume', () => {
    const history = [workout(daysAgo(now, 0), 1500), workout(daysAgo(now, 1), 500), workout(daysAgo(now, 10), 999)];
    expect(weekVolumeLbs(history, now)).toBe(2000);
  });
});
