import { getExercise } from '../data/exercises';
import { HistoryItem, MuscleGroup } from '../types';

/**
 * Deterministic, transparent recovery heuristic — NOT a medical measurement.
 * A muscle group is considered "recovering" for 48 hours after it was last
 * trained, then "ready". Groups untrained in the last 7 days are omitted.
 * The UI explains these rules verbatim so users know exactly what they mean.
 */
export const RECOVERY_WINDOW_HOURS = 48;
export const RECOVERY_LOOKBACK_DAYS = 7;

export type RecoveryStatus = 'recovering' | 'ready';

export interface MuscleRecovery {
  muscle: MuscleGroup;
  hoursSince: number;
  status: RecoveryStatus;
  /** 0 (just trained) → 1 (fully past the recovery window). */
  progress: number;
}

export function muscleRecovery(history: HistoryItem[], now: Date): MuscleRecovery[] {
  const lastTrained = new Map<MuscleGroup, number>();
  const cutoff = now.getTime() - RECOVERY_LOOKBACK_DAYS * 24 * 3600 * 1000;

  for (const item of history) {
    const t = new Date(item.dateISO).getTime();
    if (Number.isNaN(t) || t < cutoff || t > now.getTime()) continue;
    for (const ex of item.exercises) {
      if (ex.sets.length === 0) continue;
      for (const muscle of getExercise(ex.exerciseId).muscles) {
        const prev = lastTrained.get(muscle);
        if (prev === undefined || t > prev) lastTrained.set(muscle, t);
      }
    }
  }

  const out: MuscleRecovery[] = [];
  for (const [muscle, t] of lastTrained) {
    const hoursSince = (now.getTime() - t) / 3600000;
    out.push({
      muscle,
      hoursSince,
      status: hoursSince < RECOVERY_WINDOW_HOURS ? 'recovering' : 'ready',
      progress: Math.min(1, hoursSince / RECOVERY_WINDOW_HOURS),
    });
  }
  // Most-recently-trained (least recovered) first.
  return out.sort((a, b) => a.hoursSince - b.hoursSince);
}
