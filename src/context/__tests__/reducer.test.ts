import { buildDefaultState } from '../../storage/defaultState';
import { AppState, WeightEntry } from '../../types';
import { dateKey } from '../../utils/date';
import { reducer } from '../reducer';

function entry(id: string, dateISO: string, weightLbs: number): WeightEntry {
  return { id, dateISO, weightLbs };
}

function stateWith(overrides: Partial<AppState> = {}): AppState {
  return { ...buildDefaultState(), ...overrides };
}

describe('weight log ordering', () => {
  it('keeps weightLog newest first with weightLog[0] the most recent', () => {
    let state = stateWith();
    state = reducer(state, { type: 'LOG_WEIGHT', entry: entry('a', '2026-07-01T08:00:00Z', 180) });
    state = reducer(state, { type: 'LOG_WEIGHT', entry: entry('b', '2026-07-10T08:00:00Z', 178) });
    state = reducer(state, { type: 'LOG_WEIGHT', entry: entry('c', '2026-07-05T08:00:00Z', 179) });
    expect(state.weightLog.map((w) => w.id)).toEqual(['b', 'c', 'a']);
    expect(state.weightLog[0].weightLbs).toBe(178);
  });

  it('handles same-day entries and deletion', () => {
    let state = stateWith();
    state = reducer(state, { type: 'LOG_WEIGHT', entry: entry('a', '2026-07-10T08:00:00Z', 180) });
    state = reducer(state, { type: 'LOG_WEIGHT', entry: entry('b', '2026-07-10T20:00:00Z', 179) });
    expect(state.weightLog[0].id).toBe('b');
    state = reducer(state, { type: 'DELETE_WEIGHT', id: 'b' });
    expect(state.weightLog.map((w) => w.id)).toEqual(['a']);
  });
});

describe('daily goal date reset', () => {
  it('resets counters when the goal date is stale', () => {
    const stale = stateWith({
      goals: { water: 5, steps: true, calories: true, date: '2020-01-01' },
    });
    const fresh = reducer(stale, { type: 'ENSURE_GOALS_FRESH' });
    expect(fresh.goals.water).toBe(0);
    expect(fresh.goals.steps).toBe(false);
    expect(fresh.goals.calories).toBe(false);
    expect(fresh.goals.date).toBe(dateKey(new Date()));
  });

  it('resets before applying water increments on a new day', () => {
    const stale = stateWith({
      goals: { water: 5, steps: true, calories: false, date: '2020-01-01' },
    });
    const next = reducer(stale, { type: 'ADD_WATER', delta: 1 });
    expect(next.goals.water).toBe(1); // 0 + 1, not 6
  });

  it('keeps counters within the same day and floors water at zero', () => {
    const today = stateWith();
    const withWater = reducer(today, { type: 'ADD_WATER', delta: 1 });
    expect(withWater.goals.water).toBe(1);
    const floored = reducer(withWater, { type: 'ADD_WATER', delta: -5 });
    expect(floored.goals.water).toBe(0);
  });

  it('uses the simulated date when devOffset is set', () => {
    const state = stateWith({ devOffset: 3 });
    const next = reducer(state, { type: 'ENSURE_GOALS_FRESH' });
    expect(next.goals.date).toBe(dateKey(new Date(Date.now() + 3 * 86400000)));
  });
});

describe('premium transitions', () => {
  it('assigns a personalized split on upgrade and clears it on downgrade', () => {
    let state = stateWith({ frequency: 5 });
    state = reducer(state, { type: 'SET_PREMIUM', premium: true });
    expect(state.personalizedSplitId).toBe('ul-fb5');
    expect(state.split).toBe('ul-fb5');
    state = reducer(state, { type: 'SET_PREMIUM', premium: false });
    expect(state.personalizedSplitId).toBeNull();
    expect(state.split).toBe('ppl');
  });
});

describe('onboarding completion', () => {
  it('completes with a free split for free users', () => {
    let state = stateWith({ frequency: 4, physique: 'aesthetic' });
    state = reducer(state, { type: 'COMPLETE_ONBOARDING', premium: false });
    expect(state.onboardingComplete).toBe(true);
    expect(state.split).toBe('ul');
    expect(state.personalizedSplitId).toBeNull();
  });

  it('never persists undefined over saved answers', () => {
    let state = stateWith({ user: 'Alex' });
    state = reducer(state, { type: 'SAVE_ONBOARDING_ANSWERS', answers: { user: undefined, frequency: 5 } });
    expect(state.user).toBe('Alex');
    expect(state.frequency).toBe(5);
  });
});

describe('custom splits', () => {
  const seven = Array.from({ length: 7 }, (_, i) => ({ name: `Day ${i + 1}`, type: 'rest' as const }));

  it('rejects splits that are not exactly seven days', () => {
    const state = stateWith();
    const next = reducer(state, {
      type: 'SAVE_CUSTOM_SPLIT',
      split: { id: 'x', name: 'Bad', days: seven.slice(0, 6) },
    });
    expect(next.customSplits).toHaveLength(0);
  });

  it('saves, updates and deletes seven-day splits', () => {
    let state = stateWith();
    state = reducer(state, { type: 'SAVE_CUSTOM_SPLIT', split: { id: 'x', name: 'Mine', days: seven } });
    expect(state.customSplits).toHaveLength(1);
    state = reducer(state, { type: 'SAVE_CUSTOM_SPLIT', split: { id: 'x', name: 'Renamed', days: seven } });
    expect(state.customSplits).toHaveLength(1);
    expect(state.customSplits[0].name).toBe('Renamed');
    state = reducer(state, { type: 'DELETE_CUSTOM_SPLIT', id: 'x' });
    expect(state.customSplits).toHaveLength(0);
  });
});

describe('active workout lifecycle', () => {
  it('finishing stores history newest first and clears the active session', () => {
    let state = stateWith({
      history: [
        {
          id: 'old',
          dateISO: '2026-06-01T10:00:00Z',
          type: 'push',
          name: 'Push',
          durationSec: 100,
          totalVolumeLbs: 1000,
          exercises: [],
          prs: [],
        },
      ],
    });
    state = reducer(state, {
      type: 'FINISH_WORKOUT',
      item: {
        id: 'new',
        dateISO: '2026-07-01T10:00:00Z',
        type: 'pull',
        name: 'Pull',
        durationSec: 200,
        totalVolumeLbs: 2000,
        exercises: [],
        prs: [],
      },
    });
    expect(state.history.map((h) => h.id)).toEqual(['new', 'old']);
    expect(state.activeWorkout).toBeNull();
  });
});
