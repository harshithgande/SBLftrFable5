import { HistoryItem, WeightEntry } from '../types';
import { MS_PER_DAY } from './date';
import { uid } from './id';

/**
 * Developer-mode sample data. Only reachable from the dev panel — clearly
 * synthetic and never presented as real user history in production flows.
 */
export function buildTestData(now: Date): { history: HistoryItem[]; weightLog: WeightEntry[] } {
  const history: HistoryItem[] = [];
  const weightLog: WeightEntry[] = [];
  const baseWeight = 180;

  for (let daysAgo = 21; daysAgo >= 1; daysAgo -= 2) {
    const date = new Date(now.getTime() - daysAgo * MS_PER_DAY);
    const progress = (21 - daysAgo) / 21;
    const upper = daysAgo % 4 === 1;
    const benchWeight = Math.round(95 + progress * 20);
    const pressWeight = Math.round(60 + progress * 15);
    const legWeight = Math.round(180 + progress * 40);

    history.push({
      id: uid(),
      dateISO: date.toISOString(),
      type: upper ? 'upper' : 'lower',
      name: upper ? 'Upper' : 'Lower',
      durationSec: 2400 + Math.round(progress * 600),
      totalVolumeLbs: upper
        ? benchWeight * 8 * 2 + pressWeight * 10 * 2
        : legWeight * 10 * 2,
      exercises: upper
        ? [
            {
              exerciseId: 'incline-smith-bench',
              name: 'Incline Smith Bench',
              sets: [
                { weightLbs: benchWeight, reps: 8 },
                { weightLbs: benchWeight, reps: 7 },
              ],
              bestWeightLbs: benchWeight,
              bestReps: 8,
            },
            {
              exerciseId: 'smith-shoulder-press',
              name: 'Smith Shoulder Press',
              sets: [
                { weightLbs: pressWeight, reps: 10 },
                { weightLbs: pressWeight, reps: 9 },
              ],
              bestWeightLbs: pressWeight,
              bestReps: 10,
            },
          ]
        : [
            {
              exerciseId: 'leg-press',
              name: 'Leg Press',
              sets: [
                { weightLbs: legWeight, reps: 10 },
                { weightLbs: legWeight, reps: 10 },
              ],
              bestWeightLbs: legWeight,
              bestReps: 10,
            },
          ],
      prs: [],
    });
  }

  for (let daysAgo = 21; daysAgo >= 0; daysAgo -= 3) {
    const date = new Date(now.getTime() - daysAgo * MS_PER_DAY);
    weightLog.push({
      id: uid(),
      dateISO: date.toISOString(),
      weightLbs: Math.round((baseWeight - (21 - daysAgo) * 0.15) * 10) / 10,
    });
  }

  // Both lists are consumed newest-first.
  history.reverse();
  weightLog.reverse();
  return { history, weightLog };
}
