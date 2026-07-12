import { HistoryItem } from '../../types';
import { collectBests, detectPRs, epley1RM, lastPerformance } from '../pr';

function session(sets: { weightLbs: number; reps: number }[], dateISO = '2026-07-01T10:00:00Z'): HistoryItem {
  return {
    id: `h-${dateISO}`,
    dateISO,
    type: 'push',
    name: 'Push',
    durationSec: 1800,
    totalVolumeLbs: 0,
    exercises: [
      {
        exerciseId: 'chest-fly',
        name: 'Chest Fly',
        sets,
        bestWeightLbs: sets[0]?.weightLbs ?? 0,
        bestReps: sets[0]?.reps ?? 0,
      },
    ],
    prs: [],
  };
}

describe('PR detection', () => {
  const history = [session([{ weightLbs: 100, reps: 8 }, { weightLbs: 110, reps: 5 }])];

  it('never awards a PR without prior history', () => {
    const bests = collectBests([], 'chest-fly');
    expect(detectPRs(bests, 200, 20)).toEqual([]);
  });

  it('detects a weight PR only above the previous max', () => {
    const bests = collectBests(history, 'chest-fly');
    expect(detectPRs(bests, 115, 3)).toContain('weight');
    expect(detectPRs(bests, 110, 4)).not.toContain('weight');
  });

  it('detects a rep PR only at a previously used weight', () => {
    const bests = collectBests(history, 'chest-fly');
    expect(detectPRs(bests, 100, 9)).toContain('reps');
    // 105 was never used: novel weight must NOT create a meaningless rep PR.
    expect(detectPRs(bests, 105, 9)).not.toContain('reps');
    expect(detectPRs(bests, 100, 8)).not.toContain('reps');
  });

  it('detects an estimated-1RM PR', () => {
    const bests = collectBests(history, 'chest-fly');
    // Best prior e1rm: 100*(1+8/30) ≈ 126.7. 105×8 ≈ 133 -> PR.
    expect(detectPRs(bests, 105, 8)).toContain('e1rm');
    expect(detectPRs(bests, 90, 8)).toEqual([]);
  });

  it('ignores zero and negative inputs', () => {
    const bests = collectBests(history, 'chest-fly');
    expect(detectPRs(bests, 0, 10)).toEqual([]);
    expect(detectPRs(bests, 120, 0)).toEqual([]);
  });

  it('caps reps in the 1RM estimate to avoid runaway values', () => {
    expect(epley1RM(100, 12)).toBeCloseTo(epley1RM(100, 30), 5);
  });
});

describe('lastPerformance', () => {
  it('returns the newest logged top set (history is newest first)', () => {
    const history = [
      session([{ weightLbs: 120, reps: 6 }], '2026-07-08T10:00:00Z'),
      session([{ weightLbs: 100, reps: 8 }], '2026-07-01T10:00:00Z'),
    ];
    const last = lastPerformance(history, 'chest-fly');
    expect(last?.weightLbs).toBe(120);
  });

  it('returns null for unseen exercises', () => {
    expect(lastPerformance([], 'chest-fly')).toBeNull();
  });
});
