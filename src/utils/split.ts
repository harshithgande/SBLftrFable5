import { SPLITS } from '../data/splits';
import { DaySlot } from '../types';

export interface SplitAssignment {
  split: string;
  schedule: DaySlot[];
  /** Non-null only for premium users on a science-based personalized split. */
  personalizedSplitId: string | null;
}

/**
 * Science-based split assignment.
 * Premium: 3 -> fb3, 4 -> ul-fb4, 5 -> ul-fb5, 6 -> ul6.
 * Free: ul at four or fewer days, ppl at five or more; never personalized.
 */
export function assignSplit(premium: boolean, frequency: number | null): SplitAssignment {
  const days = clampFrequency(frequency);

  if (premium) {
    const id = days <= 3 ? 'fb3' : days === 4 ? 'ul-fb4' : days === 5 ? 'ul-fb5' : 'ul6';
    return { split: id, schedule: [...SPLITS[id].schedule], personalizedSplitId: id };
  }

  const id = days <= 4 ? 'ul' : 'ppl';
  return { split: id, schedule: [...SPLITS[id].schedule], personalizedSplitId: null };
}

export function clampFrequency(frequency: number | null): number {
  if (frequency === null || !Number.isFinite(frequency)) return 4;
  return Math.min(6, Math.max(3, Math.round(frequency)));
}
