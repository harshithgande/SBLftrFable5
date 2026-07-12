import { DaySlot } from '../types';

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * The app's notion of "now": real time shifted by the developer-mode day
 * offset. Every date-dependent feature must go through this so date
 * simulation behaves consistently.
 */
export function simulatedNow(devOffset: number, base: Date = new Date()): Date {
  return new Date(base.getTime() + devOffset * MS_PER_DAY);
}

/** Local calendar key, YYYY-MM-DD. */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Monday-first weekday index: Mon=0 … Sun=6. */
export function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/** The schedule slot for the given (possibly simulated) date. */
export function slotForDate(schedule: DaySlot[], d: Date): DaySlot {
  if (schedule.length !== 7) return 'rest';
  return schedule[mondayIndex(d)];
}

export function startOfWeek(d: Date): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  out.setDate(out.getDate() - mondayIndex(d));
  return out;
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return dateKey(a) === dateKey(b);
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function dayName(mondayIdx: number): string {
  return DAY_NAMES[((mondayIdx % 7) + 7) % 7];
}

export function dayAbbr(mondayIdx: number): string {
  return DAY_ABBR[((mondayIdx % 7) + 7) % 7];
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${MONTH_ABBR[d.getMonth()]} ${d.getDate()}`;
}

export function formatMediumDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${DAY_ABBR[mondayIndex(d)]}, ${MONTH_ABBR[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatDuration(totalSec: number): string {
  const min = Math.floor(totalSec / 60);
  const sec = Math.floor(totalSec % 60);
  if (min >= 60) {
    const h = Math.floor(min / 60);
    return `${h}h ${min % 60}m`;
  }
  return `${min}:${`${sec}`.padStart(2, '0')}`;
}

/** Time-of-day greeting, e.g. "Good morning". */
export function greetingForHour(hour: number): string {
  if (hour < 5) return 'Late night grind';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
