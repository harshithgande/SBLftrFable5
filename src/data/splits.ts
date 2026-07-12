import { DaySlot, SplitDefinition } from '../types';

export const DAYS_IN_WEEK = 7;

/**
 * Built-in split definitions. Schedules are Monday-first, exactly seven slots.
 * The premium per-frequency schedules follow the science-based mapping:
 *   3 days -> fb3, 4 -> ul-fb4, 5 -> ul-fb5, 6 -> ul6.
 */
export const SPLITS: Record<string, SplitDefinition> = {
  fb3: {
    id: 'fb3',
    name: 'Full Body ×3',
    description: 'Three full-body sessions with a rest day between each — maximum frequency per muscle on three days.',
    schedule: ['full', 'rest', 'full', 'rest', 'full', 'rest', 'rest'],
    daysPerWeek: 3,
    premium: true,
  },
  'ul-fb4': {
    id: 'ul-fb4',
    name: 'Upper / Lower + Full Body',
    description: 'An upper and lower pair plus two full-body days — every muscle trained at least twice a week.',
    schedule: ['upper', 'lower', 'rest', 'full', 'rest', 'full', 'rest'],
    daysPerWeek: 4,
    premium: true,
  },
  'ul-fb5': {
    id: 'ul-fb5',
    name: 'Upper / Lower / Full Hybrid',
    description: 'Two upper–lower pairs with a mid-week full-body bridge for extra volume where you need it.',
    schedule: ['upper', 'lower', 'rest', 'full', 'rest', 'upper', 'lower'],
    daysPerWeek: 5,
    premium: true,
  },
  ul6: {
    id: 'ul6',
    name: 'Upper / Lower ×3',
    description: 'Three upper–lower pairs — high weekly volume with each muscle hit three times.',
    schedule: ['upper', 'lower', 'rest', 'upper', 'lower', 'upper', 'lower'],
    daysPerWeek: 6,
    premium: true,
  },
  ul: {
    id: 'ul',
    name: 'Upper / Lower',
    description: 'The classic four-day upper–lower split. Simple, proven, and easy to stay consistent with.',
    schedule: ['upper', 'lower', 'rest', 'upper', 'lower', 'rest', 'rest'],
    daysPerWeek: 4,
    premium: false,
  },
  ppl: {
    id: 'ppl',
    name: 'Push / Pull / Legs',
    description: 'The classic six-day push–pull–legs rotation for higher training frequencies.',
    schedule: ['push', 'pull', 'lower', 'push', 'pull', 'lower', 'rest'],
    daysPerWeek: 6,
    premium: false,
  },
};

/** Split IDs offered to everyone in the split picker. */
export const CLASSIC_SPLIT_IDS = ['ul', 'ppl'] as const;

export function isValidSchedule(schedule: unknown): schedule is DaySlot[] {
  if (!Array.isArray(schedule) || schedule.length !== DAYS_IN_WEEK) return false;
  const valid: DaySlot[] = ['push', 'pull', 'lower', 'upper', 'full', 'rest'];
  return schedule.every((slot) => valid.includes(slot as DaySlot));
}
