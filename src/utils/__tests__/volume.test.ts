import { ActiveWorkout } from '../../types';
import { completedSetCount, workoutVolumeLbs } from '../volume';

const workout: ActiveWorkout = {
  id: 'w1',
  type: 'push',
  name: 'Push',
  startedAt: '2026-07-10T10:00:00Z',
  exercises: [
    {
      exerciseId: 'chest-fly',
      name: 'Chest Fly',
      sets: [
        { id: 's1', weightLbs: 100, reps: 10, completed: true },
        { id: 's2', weightLbs: 100, reps: 8, completed: true },
        { id: 's3', weightLbs: 105, reps: 6, completed: false },
      ],
    },
    {
      exerciseId: 'jm-press',
      name: 'JM Press',
      sets: [
        { id: 's4', weightLbs: 0, reps: 0, completed: true },
        { id: 's5', weightLbs: 80, reps: 12, completed: true },
      ],
    },
  ],
};

describe('workout volume', () => {
  it('sums weight × reps for completed, valid sets only', () => {
    // 100×10 + 100×8 + 80×12 = 2760; incomplete and zero sets excluded.
    expect(workoutVolumeLbs(workout)).toBe(2760);
  });

  it('counts completed sets', () => {
    expect(completedSetCount(workout)).toBe(4);
  });

  it('handles an empty workout', () => {
    expect(workoutVolumeLbs({ ...workout, exercises: [] })).toBe(0);
  });
});
