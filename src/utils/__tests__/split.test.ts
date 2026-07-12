import { SPLITS, isValidSchedule } from '../../data/splits';
import { assignSplit, clampFrequency } from '../split';

describe('assignSplit', () => {
  it('assigns science-based premium splits by frequency', () => {
    expect(assignSplit(true, 3).split).toBe('fb3');
    expect(assignSplit(true, 4).split).toBe('ul-fb4');
    expect(assignSplit(true, 5).split).toBe('ul-fb5');
    expect(assignSplit(true, 6).split).toBe('ul6');
  });

  it('sets personalizedSplitId only for premium users', () => {
    expect(assignSplit(true, 4).personalizedSplitId).toBe('ul-fb4');
    expect(assignSplit(false, 4).personalizedSplitId).toBeNull();
    expect(assignSplit(false, 6).personalizedSplitId).toBeNull();
  });

  it('gives free users ul at four or fewer days and ppl at five or more', () => {
    expect(assignSplit(false, 3).split).toBe('ul');
    expect(assignSplit(false, 4).split).toBe('ul');
    expect(assignSplit(false, 5).split).toBe('ppl');
    expect(assignSplit(false, 6).split).toBe('ppl');
  });

  it('always returns a seven-day schedule', () => {
    for (const premium of [true, false]) {
      for (const days of [3, 4, 5, 6, null]) {
        const result = assignSplit(premium, days);
        expect(result.schedule).toHaveLength(7);
        expect(isValidSchedule(result.schedule)).toBe(true);
      }
    }
  });

  it('matches the required seven-day schedules exactly', () => {
    expect(assignSplit(true, 3).schedule).toEqual(['full', 'rest', 'full', 'rest', 'full', 'rest', 'rest']);
    expect(assignSplit(true, 4).schedule).toEqual(['upper', 'lower', 'rest', 'full', 'rest', 'full', 'rest']);
    expect(assignSplit(true, 5).schedule).toEqual(['upper', 'lower', 'rest', 'full', 'rest', 'upper', 'lower']);
    expect(assignSplit(true, 6).schedule).toEqual(['upper', 'lower', 'rest', 'upper', 'lower', 'upper', 'lower']);
  });

  it('clamps out-of-range frequencies', () => {
    expect(clampFrequency(null)).toBe(4);
    expect(clampFrequency(1)).toBe(3);
    expect(clampFrequency(9)).toBe(6);
  });
});

describe('isValidSchedule', () => {
  it('accepts every built-in split', () => {
    for (const split of Object.values(SPLITS)) {
      expect(isValidSchedule(split.schedule)).toBe(true);
    }
  });

  it('rejects wrong lengths and unknown slots', () => {
    expect(isValidSchedule(['upper', 'lower'])).toBe(false);
    expect(isValidSchedule(['upper', 'lower', 'rest', 'rest', 'rest', 'rest', 'legs'])).toBe(false);
    expect(isValidSchedule(null)).toBe(false);
    expect(isValidSchedule('ul')).toBe(false);
  });
});
