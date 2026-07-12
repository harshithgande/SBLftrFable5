import { DaySlot } from '../../types';
import { dateKey, mondayIndex, simulatedNow, slotForDate, startOfWeek } from '../date';

const SCHEDULE: DaySlot[] = ['upper', 'lower', 'rest', 'full', 'rest', 'full', 'rest'];

describe('date simulation', () => {
  it('offsets now by whole days', () => {
    const base = new Date(2026, 6, 6, 10, 0, 0); // Monday
    expect(dateKey(simulatedNow(0, base))).toBe('2026-07-06');
    expect(dateKey(simulatedNow(1, base))).toBe('2026-07-07');
    expect(dateKey(simulatedNow(-2, base))).toBe('2026-07-04');
  });
});

describe('workout of the day', () => {
  it('maps Monday-first schedules to calendar days', () => {
    const monday = new Date(2026, 6, 6);
    const sunday = new Date(2026, 6, 12);
    expect(mondayIndex(monday)).toBe(0);
    expect(mondayIndex(sunday)).toBe(6);
    expect(slotForDate(SCHEDULE, monday)).toBe('upper');
    expect(slotForDate(SCHEDULE, new Date(2026, 6, 9))).toBe('full'); // Thursday
    expect(slotForDate(SCHEDULE, sunday)).toBe('rest');
  });

  it('changes the workout when the simulated offset crosses days', () => {
    const base = new Date(2026, 6, 6, 12, 0, 0); // Monday -> upper
    expect(slotForDate(SCHEDULE, simulatedNow(0, base))).toBe('upper');
    expect(slotForDate(SCHEDULE, simulatedNow(1, base))).toBe('lower');
    expect(slotForDate(SCHEDULE, simulatedNow(3, base))).toBe('full');
  });

  it('returns rest for malformed schedules instead of crashing', () => {
    expect(slotForDate(['upper'] as DaySlot[], new Date())).toBe('rest');
  });
});

describe('startOfWeek', () => {
  it('returns the Monday of the containing week', () => {
    expect(dateKey(startOfWeek(new Date(2026, 6, 8)))).toBe('2026-07-06'); // Wed -> Mon
    expect(dateKey(startOfWeek(new Date(2026, 6, 12)))).toBe('2026-07-06'); // Sun -> Mon
    expect(dateKey(startOfWeek(new Date(2026, 6, 6)))).toBe('2026-07-06'); // Mon -> Mon
  });
});
