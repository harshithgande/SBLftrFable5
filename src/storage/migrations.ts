import { isValidSchedule } from '../data/splits';
import { AppState } from '../types';
import { buildWorkoutLibrary } from '../utils/ordering';
import { buildDefaultState, SCHEMA_VERSION } from './defaultState';

/**
 * Storage migrations + defensive rehydration.
 *
 * `migrate` receives whatever JSON was on disk and must always return a
 * fully valid AppState. Strategy:
 *  1. run versioned migration steps to bring old payloads up to date,
 *  2. deep-merge over DEFAULT_STATE so missing keys get safe defaults,
 *  3. sanitize invariants (seven-day schedule, newest-first logs, arrays),
 *  4. always clear activeWorkout on a full restart (an in-progress session
 *     must not silently resume after the process died).
 */

type MigrationStep = (raw: Record<string, unknown>) => Record<string, unknown>;

/** Keyed by the version the payload is AT; each step upgrades by one. */
const MIGRATIONS: Record<number, MigrationStep> = {
  // v0 payloads predate schemaVersion. Nothing structural to rewrite yet —
  // the merge + sanitize pass fills every gap.
  0: (raw) => ({ ...raw, schemaVersion: 1 }),
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function numberOr<T>(value: unknown, fallback: T): number | T {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function migrate(saved: unknown): AppState {
  const defaults = buildDefaultState();
  let raw = asRecord(saved);
  if (!raw) return defaults;

  let version = numberOr(raw.schemaVersion, 0);
  while (version < SCHEMA_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) break;
    raw = step(raw);
    version = numberOr(raw.schemaVersion, version + 1);
  }

  const merged: AppState = {
    ...defaults,
    ...(raw as Partial<AppState>),
    schemaVersion: SCHEMA_VERSION,
    // Required by spec: an in-progress workout never survives a full restart.
    activeWorkout: null,
  };

  return sanitize(merged, defaults);
}

function sanitize(state: AppState, defaults: AppState): AppState {
  const out = { ...state };

  if (!isValidSchedule(out.schedule)) {
    out.schedule = [...defaults.schedule];
    out.split = defaults.split;
  }
  if (!Array.isArray(out.obstacles)) out.obstacles = [];
  if (!Array.isArray(out.customSplits)) out.customSplits = [];
  else out.customSplits = out.customSplits.filter((s) => Array.isArray(s?.days) && s.days.length === 7);
  if (!Array.isArray(out.history)) out.history = [];
  if (!Array.isArray(out.photos)) out.photos = [];

  if (!Array.isArray(out.weightLog)) out.weightLog = [];
  // Invariant: weightLog[0] is the newest entry.
  out.weightLog = [...out.weightLog]
    .filter((w) => w && typeof w.weightLbs === 'number' && Number.isFinite(w.weightLbs))
    .sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());

  if (out.units !== 'kg' && out.units !== 'lb') out.units = defaults.units;
  out.restDefault = numberOr(out.restDefault, defaults.restDefault);
  out.devOffset = numberOr(out.devOffset, 0);
  out.premium = out.premium === true;
  out.devMode = out.devMode === true;
  out.onboardingComplete = out.onboardingComplete === true;
  if (!out.premium) out.personalizedSplitId = null;

  const goals = asRecord(out.goals);
  out.goals = goals
    ? {
        water: numberOr(goals.water, 0),
        steps: goals.steps === true,
        calories: goals.calories === true,
        date: typeof goals.date === 'string' ? goals.date : defaults.goals.date,
      }
    : { ...defaults.goals };

  const targets = asRecord(out.goalTargets);
  out.goalTargets = targets
    ? {
        water: Math.max(1, numberOr(targets.water, defaults.goalTargets.water)),
        steps: Math.max(1, numberOr(targets.steps, defaults.goalTargets.steps)),
        calories: Math.max(1, numberOr(targets.calories, defaults.goalTargets.calories)),
      }
    : { ...defaults.goalTargets };

  // Workout definitions are code-owned: always rebuild from current data files
  // (ordered for the user's goal) so exercise updates ship without a migration.
  const validPhysique =
    out.physique === 'athletic' || out.physique === 'aesthetic' || out.physique === 'strongman'
      ? out.physique
      : null;
  out.physique = validPhysique;
  out.workouts = buildWorkoutLibrary(validPhysique);

  return out;
}
