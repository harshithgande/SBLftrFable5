import { ActiveWorkout, HistorySet } from '../types';

/** Total volume (weight × reps) across completed sets, in lbs. */
export function workoutVolumeLbs(workout: ActiveWorkout): number {
  let total = 0;
  for (const ex of workout.exercises) {
    for (const set of ex.sets) {
      if (set.completed && set.weightLbs > 0 && set.reps > 0) {
        total += set.weightLbs * set.reps;
      }
    }
  }
  return Math.round(total);
}

export function setsVolumeLbs(sets: HistorySet[]): number {
  return Math.round(sets.reduce((sum, s) => sum + s.weightLbs * s.reps, 0));
}

export function completedSetCount(workout: ActiveWorkout): number {
  return workout.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0
  );
}
