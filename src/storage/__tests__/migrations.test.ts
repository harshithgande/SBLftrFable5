import { buildDefaultState, SCHEMA_VERSION } from '../defaultState';
import { migrate } from '../migrations';

describe('state migration / rehydration', () => {
  it('returns full defaults for null, garbage or corrupt payloads', () => {
    for (const payload of [null, undefined, 42, 'oops', [], { schemaVersion: 'x' }]) {
      const state = migrate(payload);
      expect(state.schemaVersion).toBe(SCHEMA_VERSION);
      expect(state.schedule).toHaveLength(7);
      expect(state.activeWorkout).toBeNull();
      expect(state.onboardingComplete).toBe(false);
    }
  });

  it('merges saved values over defaults', () => {
    const state = migrate({ user: 'Alex', premium: true, units: 'kg', frequency: 5 });
    expect(state.user).toBe('Alex');
    expect(state.premium).toBe(true);
    expect(state.units).toBe('kg');
    // Untouched keys fall back to defaults.
    expect(state.restDefault).toBe(buildDefaultState().restDefault);
  });

  it('always clears activeWorkout on rehydration', () => {
    const state = migrate({
      activeWorkout: { id: 'w', type: 'push', name: 'Push', startedAt: 'x', exercises: [] },
    });
    expect(state.activeWorkout).toBeNull();
  });

  it('repairs invalid schedules', () => {
    const state = migrate({ schedule: ['upper', 'nope'], split: 'broken' });
    expect(state.schedule).toHaveLength(7);
    expect(state.split).toBe(buildDefaultState().split);
  });

  it('re-sorts the weight log newest first and drops malformed entries', () => {
    const state = migrate({
      weightLog: [
        { id: 'a', dateISO: '2026-01-01T00:00:00Z', weightLbs: 180 },
        { id: 'bad', dateISO: '2026-01-05T00:00:00Z', weightLbs: 'NaN' },
        { id: 'b', dateISO: '2026-03-01T00:00:00Z', weightLbs: 175 },
      ],
    });
    expect(state.weightLog.map((w) => w.id)).toEqual(['b', 'a']);
  });

  it('strips personalizedSplitId from non-premium users', () => {
    const state = migrate({ premium: false, personalizedSplitId: 'ul-fb4' });
    expect(state.personalizedSplitId).toBeNull();
  });

  it('drops custom splits that are not exactly seven days', () => {
    const seven = Array.from({ length: 7 }, (_, i) => ({ name: `D${i}`, type: 'rest' }));
    const state = migrate({
      customSplits: [
        { id: 'ok', name: 'Mine', days: seven },
        { id: 'short', name: 'Broken', days: seven.slice(0, 5) },
        { id: 'nodays', name: 'Broken2' },
      ],
    });
    expect(state.customSplits.map((s) => s.id)).toEqual(['ok']);
  });

  it('rebuilds workouts ordered for the saved physique goal', () => {
    const state = migrate({ physique: 'aesthetic' });
    expect(state.workouts.push.exercises[0].exerciseId).toBe('db-lateral-raise');
    const invalid = migrate({ physique: 'bodybuilder' });
    expect(invalid.physique).toBeNull();
  });

  it('upgrades versionless payloads via the migration chain', () => {
    const state = migrate({ user: 'Sam' });
    expect(state.schemaVersion).toBe(SCHEMA_VERSION);
    expect(state.user).toBe('Sam');
  });
});
