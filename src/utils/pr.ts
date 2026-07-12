import { HistoryItem, PRKind } from '../types';

/**
 * Personal-record detection.
 *
 * A set only counts as a PR when the exercise has prior logged history —
 * a first-ever performance is a baseline, not a record. Three PR kinds:
 * - weight: heavier than any previous set of that exercise
 * - reps:   more reps than ever done before AT THAT EXACT WEIGHT (weight must
 *           have been used before, so novel weights don't spam rep PRs)
 * - e1rm:   higher estimated one-rep max (Epley) than any previous set
 */

/** Epley estimated one-rep max. Reps are capped: the formula is unreliable past ~12. */
export function epley1RM(weightLbs: number, reps: number): number {
  if (weightLbs <= 0 || reps <= 0) return 0;
  const cappedReps = Math.min(reps, 12);
  return weightLbs * (1 + cappedReps / 30);
}

export interface ExerciseBests {
  maxWeight: number;
  /** Best rep count seen at each exact weight. */
  repsAtWeight: Map<number, number>;
  bestE1rm: number;
  hasHistory: boolean;
}

/** Aggregate an exercise's previous performance across saved history. */
export function collectBests(history: HistoryItem[], exerciseId: string): ExerciseBests {
  const bests: ExerciseBests = {
    maxWeight: 0,
    repsAtWeight: new Map(),
    bestE1rm: 0,
    hasHistory: false,
  };
  for (const item of history) {
    for (const ex of item.exercises) {
      if (ex.exerciseId !== exerciseId) continue;
      for (const set of ex.sets) {
        if (set.weightLbs <= 0 || set.reps <= 0) continue;
        bests.hasHistory = true;
        bests.maxWeight = Math.max(bests.maxWeight, set.weightLbs);
        const prevReps = bests.repsAtWeight.get(set.weightLbs) ?? 0;
        if (set.reps > prevReps) bests.repsAtWeight.set(set.weightLbs, set.reps);
        bests.bestE1rm = Math.max(bests.bestE1rm, epley1RM(set.weightLbs, set.reps));
      }
    }
  }
  return bests;
}

/** PR kinds earned by a set, given previously aggregated bests. */
export function detectPRs(bests: ExerciseBests, weightLbs: number, reps: number): PRKind[] {
  if (!bests.hasHistory || weightLbs <= 0 || reps <= 0) return [];
  const kinds: PRKind[] = [];
  if (weightLbs > bests.maxWeight) kinds.push('weight');
  const prevRepsHere = bests.repsAtWeight.get(weightLbs);
  if (prevRepsHere !== undefined && reps > prevRepsHere) kinds.push('reps');
  if (epley1RM(weightLbs, reps) > bests.bestE1rm + 1e-9) kinds.push('e1rm');
  return kinds;
}

/** Human label for a PR kind. Never expose formula names to users. */
export function prLabel(kind: PRKind): string {
  switch (kind) {
    case 'weight':
      return 'Heaviest ever';
    case 'reps':
      return 'Rep record';
    case 'e1rm':
      return 'New strength best';
  }
}

/** The most recent logged performance of an exercise, for in-workout reference. */
export function lastPerformance(
  history: HistoryItem[],
  exerciseId: string
): { weightLbs: number; reps: number; dateISO: string } | null {
  for (const item of history) {
    for (const ex of item.exercises) {
      if (ex.exerciseId !== exerciseId) continue;
      const top = ex.sets.filter((s) => s.weightLbs > 0 && s.reps > 0);
      if (top.length === 0) continue;
      const best = top.reduce((a, b) => (epley1RM(b.weightLbs, b.reps) > epley1RM(a.weightLbs, a.reps) ? b : a));
      return { weightLbs: best.weightLbs, reps: best.reps, dateISO: item.dateISO };
    }
  }
  return null;
}
