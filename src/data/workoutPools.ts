import { WorkoutType } from '../types';

/**
 * Exercise pools per workout type. Order here is neutral; the display order
 * and set counts are derived in src/utils/ordering.ts from the physique-goal
 * priority configuration in src/data/priorities.ts.
 */
export const PUSH_POOL: string[] = [
  'chest-fly',
  'db-lateral-raise',
  'single-arm-tricep-ext',
  'incline-smith-bench',
  'jm-press',
  'smith-shoulder-press',
];

export const PULL_POOL: string[] = [
  'lat-pulldown',
  'incline-curl',
  'kelso-shrug',
  'preacher-curl',
  'cg-chest-supported-row',
  'rear-delt-fly',
];

export const LOWER_POOL: string[] = [
  'leg-extension',
  'leg-curl',
  'leg-press',
  'sldl',
  'calf-raise',
  'hip-abduction',
  'crunch-machine',
];

export const UPPER_POOL: string[] = [
  'chest-fly',
  'db-lateral-raise',
  'incline-curl',
  'single-arm-tricep-ext',
  'lat-pulldown',
  'incline-smith-bench',
  'preacher-curl',
  'smith-shoulder-press',
  'kelso-shrug',
  'jm-press',
  'h2l-cg-pulldown',
  'cuffed-reverse-curl',
];

/** Full body combines the Upper and Lower pools. */
export const FULL_POOL: string[] = [...UPPER_POOL, ...LOWER_POOL];

export const POOLS: Record<WorkoutType, string[]> = {
  push: PUSH_POOL,
  pull: PULL_POOL,
  lower: LOWER_POOL,
  upper: UPPER_POOL,
  full: FULL_POOL,
};

/**
 * Exercises considered already well-developed in Upper / Lower sessions.
 * They default to one set and are sequenced after priority work.
 */
export const WELL_DEVELOPED_UPPER: string[] = [
  'lat-pulldown',
  'kelso-shrug',
  'incline-smith-bench',
  'smith-shoulder-press',
  'h2l-cg-pulldown',
  'preacher-curl',
];

export const WELL_DEVELOPED_LOWER: string[] = [
  'leg-press',
  'sldl',
  'leg-curl',
  'leg-extension',
  'hip-abduction',
  'calf-raise',
];

export const WELL_DEVELOPED: Record<WorkoutType, string[]> = {
  push: [],
  pull: [],
  lower: WELL_DEVELOPED_LOWER,
  upper: WELL_DEVELOPED_UPPER,
  full: [],
};

export const WORKOUT_TYPE_NAMES: Record<WorkoutType, string> = {
  push: 'Push',
  pull: 'Pull',
  lower: 'Lower',
  upper: 'Upper',
  full: 'Full Body',
};

/** Short badges used on the week strip. */
export const WORKOUT_TYPE_ABBR: Record<WorkoutType | 'rest', string> = {
  upper: 'U',
  lower: 'L',
  full: 'FB',
  push: 'P',
  pull: 'Pl',
  rest: '—',
};
