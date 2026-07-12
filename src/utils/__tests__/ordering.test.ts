import { PRIORITIES } from '../../data/priorities';
import { POOLS, WELL_DEVELOPED_LOWER, WELL_DEVELOPED_UPPER } from '../../data/workoutPools';
import { Physique, WorkoutType } from '../../types';
import { buildWorkout, buildWorkoutLibrary, defaultSetsFor, orderExercises } from '../ordering';

const GOALS: Physique[] = ['athletic', 'aesthetic', 'strongman'];
const TYPES: WorkoutType[] = ['push', 'pull', 'lower', 'upper', 'full'];

describe('default set assignment', () => {
  it('gives full-body exercises one set', () => {
    expect(defaultSetsFor('full', 'chest-fly')).toBe(1);
    expect(defaultSetsFor('full', 'leg-press')).toBe(1);
  });

  it('gives push and pull exercises two sets', () => {
    expect(defaultSetsFor('push', 'chest-fly')).toBe(2);
    expect(defaultSetsFor('pull', 'lat-pulldown')).toBe(2);
  });

  it('gives well-developed upper/lower exercises one set and priority work two', () => {
    for (const id of WELL_DEVELOPED_UPPER) expect(defaultSetsFor('upper', id)).toBe(1);
    for (const id of WELL_DEVELOPED_LOWER) expect(defaultSetsFor('lower', id)).toBe(1);
    expect(defaultSetsFor('upper', 'chest-fly')).toBe(2);
    expect(defaultSetsFor('upper', 'db-lateral-raise')).toBe(2);
    expect(defaultSetsFor('lower', 'crunch-machine')).toBe(2);
  });
});

describe('exercise ordering', () => {
  it('keeps every pool exercise exactly once for all goals and types', () => {
    for (const goal of GOALS) {
      for (const t of TYPES) {
        const ordered = orderExercises(t, goal);
        expect([...ordered].sort()).toEqual([...POOLS[t]].sort());
      }
    }
  });

  it('orders push/pull/full by the goal priority list', () => {
    for (const goal of GOALS) {
      for (const t of ['push', 'pull'] as WorkoutType[]) {
        expect(orderExercises(t, goal)).toEqual(PRIORITIES[goal][t]);
      }
    }
  });

  it('puts priority (not well-developed) work before well-developed work in upper/lower', () => {
    for (const goal of GOALS) {
      const upper = orderExercises('upper', goal);
      const firstDeveloped = upper.findIndex((id) => WELL_DEVELOPED_UPPER.includes(id));
      const lastPriority = upper.reduce(
        (last, id, i) => (!WELL_DEVELOPED_UPPER.includes(id) ? i : last),
        -1
      );
      expect(lastPriority).toBeLessThan(firstDeveloped);
    }
  });

  it('falls back to a neutral order when goal is null', () => {
    const ordered = orderExercises('push', null);
    expect(ordered).toHaveLength(POOLS.push.length);
  });
});

describe('buildWorkout', () => {
  it('combines upper and lower pools for full body with one set each', () => {
    const full = buildWorkout('full', 'aesthetic');
    expect(full.exercises).toHaveLength(POOLS.full.length);
    for (const ex of full.exercises) expect(ex.sets).toBe(1);
  });

  it('builds a complete library keyed by type', () => {
    const lib = buildWorkoutLibrary('strongman');
    expect(Object.keys(lib).sort()).toEqual(['full', 'lower', 'pull', 'push', 'upper']);
  });
});
