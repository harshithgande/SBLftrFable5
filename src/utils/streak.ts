import { HistoryItem } from '../types';
import { MS_PER_DAY, startOfWeek } from './date';

/**
 * Consistency model: a week "counts" when the user logged at least their
 * target number of sessions (training frequency). The streak is the number
 * of consecutive counting weeks ending with the most recent complete week —
 * the current, still-in-progress week extends the streak as soon as it hits
 * target but never breaks it early. No punishment mechanics.
 */

export function workoutsInWeekOf(history: HistoryItem[], anyDayInWeek: Date): number {
  const start = startOfWeek(anyDayInWeek).getTime();
  const end = start + 7 * MS_PER_DAY;
  return history.filter((h) => {
    const t = new Date(h.dateISO).getTime();
    return !Number.isNaN(t) && t >= start && t < end;
  }).length;
}

export function weekStreak(history: HistoryItem[], target: number, now: Date): number {
  const safeTarget = Math.max(1, target);
  let streak = 0;

  // Current week counts only once it has met the target.
  if (workoutsInWeekOf(history, now) >= safeTarget) streak += 1;

  // Then walk backwards one week at a time.
  let cursor = new Date(startOfWeek(now).getTime() - MS_PER_DAY);
  for (let i = 0; i < 520; i += 1) {
    if (workoutsInWeekOf(history, cursor) >= safeTarget) {
      streak += 1;
      cursor = new Date(startOfWeek(cursor).getTime() - MS_PER_DAY);
    } else {
      break;
    }
  }
  return streak;
}

/** Volume lifted in the week containing `now`, in lbs. */
export function weekVolumeLbs(history: HistoryItem[], now: Date): number {
  const start = startOfWeek(now).getTime();
  const end = start + 7 * MS_PER_DAY;
  return history
    .filter((h) => {
      const t = new Date(h.dateISO).getTime();
      return !Number.isNaN(t) && t >= start && t < end;
    })
    .reduce((sum, h) => sum + h.totalVolumeLbs, 0);
}
