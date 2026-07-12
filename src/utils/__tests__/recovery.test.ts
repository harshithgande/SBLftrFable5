import { HistoryItem } from '../../types';
import { MS_PER_DAY } from '../date';
import { muscleRecovery } from '../recovery';

function pushSession(dateISO: string): HistoryItem {
  return {
    id: dateISO,
    dateISO,
    type: 'push',
    name: 'Push',
    durationSec: 1800,
    totalVolumeLbs: 2000,
    exercises: [
      {
        exerciseId: 'chest-fly',
        name: 'Chest Fly',
        sets: [{ weightLbs: 100, reps: 10 }],
        bestWeightLbs: 100,
        bestReps: 10,
      },
    ],
    prs: [],
  };
}

describe('muscle recovery heuristic', () => {
  const now = new Date('2026-07-10T12:00:00Z');

  it('marks muscles trained under 48h ago as recovering, older as ready', () => {
    const recent = muscleRecovery([pushSession(new Date(now.getTime() - 12 * 3600000).toISOString())], now);
    expect(recent.find((r) => r.muscle === 'chest')?.status).toBe('recovering');

    const older = muscleRecovery([pushSession(new Date(now.getTime() - 3 * MS_PER_DAY).toISOString())], now);
    expect(older.find((r) => r.muscle === 'chest')?.status).toBe('ready');
  });

  it('omits muscles not trained within the 7-day lookback', () => {
    const stale = muscleRecovery([pushSession(new Date(now.getTime() - 10 * MS_PER_DAY).toISOString())], now);
    expect(stale).toHaveLength(0);
  });

  it('ignores malformed dates', () => {
    const broken = { ...pushSession('not-a-date') };
    expect(muscleRecovery([broken], now)).toHaveLength(0);
  });
});
