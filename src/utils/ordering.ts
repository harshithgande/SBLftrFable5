import { DEFAULT_PRIORITY_GOAL, PRIORITIES } from '../data/priorities';
import { POOLS, WELL_DEVELOPED, WORKOUT_TYPE_NAMES } from '../data/workoutPools';
import { Physique, WorkoutDefinition, WorkoutType } from '../types';

/**
 * Default working sets for an exercise within a workout type.
 * - full: one set per exercise
 * - push / pull: two sets per exercise
 * - upper / lower: well-developed exercises get one set, priority work gets two
 */
export function defaultSetsFor(type: WorkoutType, exerciseId: string): number {
  if (type === 'full') return 1;
  if (type === 'push' || type === 'pull') return 2;
  return WELL_DEVELOPED[type].includes(exerciseId) ? 1 : 2;
}

function priorityIndex(list: string[], id: string): number {
  const idx = list.indexOf(id);
  // Unknown ids sort last so stale data can never crash ordering.
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
}

/**
 * Order a workout type's exercise pool for a physique goal.
 * - push / pull / full: the goal's priority list is the display order.
 * - upper / lower: priority (not yet well-developed) exercises first, then
 *   well-developed ones; the goal's list ranks within each partition.
 */
export function orderExercises(type: WorkoutType, goal: Physique | null): string[] {
  const pool = POOLS[type];
  const priorities = PRIORITIES[goal ?? DEFAULT_PRIORITY_GOAL][type];

  if (type === 'upper' || type === 'lower') {
    const developed = WELL_DEVELOPED[type];
    const needsWork = pool.filter((id) => !developed.includes(id));
    const strong = pool.filter((id) => developed.includes(id));
    const byPriority = (a: string, b: string) => priorityIndex(priorities, a) - priorityIndex(priorities, b);
    return [...needsWork.sort(byPriority), ...strong.sort(byPriority)];
  }

  return [...pool].sort((a, b) => priorityIndex(priorities, a) - priorityIndex(priorities, b));
}

/** Build the full typed workout definition for a type + goal. */
export function buildWorkout(type: WorkoutType, goal: Physique | null): WorkoutDefinition {
  return {
    id: type,
    type,
    name: WORKOUT_TYPE_NAMES[type],
    exercises: orderExercises(type, goal).map((exerciseId) => ({
      exerciseId,
      sets: defaultSetsFor(type, exerciseId),
    })),
  };
}

/** All built-in workouts for a goal, keyed by workout type. */
export function buildWorkoutLibrary(goal: Physique | null): Record<string, WorkoutDefinition> {
  const types: WorkoutType[] = ['push', 'pull', 'lower', 'upper', 'full'];
  const out: Record<string, WorkoutDefinition> = {};
  for (const t of types) out[t] = buildWorkout(t, goal);
  return out;
}
