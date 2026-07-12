import { SPLITS } from '../data/splits';
import { AppState } from '../types';
import { dateKey } from '../utils/date';
import { buildWorkoutLibrary } from '../utils/ordering';

export const SCHEMA_VERSION = 1;

export function buildDefaultState(): AppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    onboardingComplete: false,
    user: null,
    physique: null,
    experience: null,
    frequency: null,
    heightFeet: null,
    heightInches: null,
    weightLbs: null,
    obstacles: [],
    limitations: null,
    onboardingPhotoUri: null,
    onboardingRearPhotoUri: null,
    gptPlan: null,
    assessment: null,
    personalizedSplitId: null,
    premium: false,
    units: 'lb',
    restDefault: 120,
    devMode: false,
    devOffset: 0,
    split: 'ul',
    schedule: [...SPLITS.ul.schedule],
    workouts: buildWorkoutLibrary(null),
    customSplits: [],
    history: [],
    weightLog: [],
    photos: [],
    lastComparison: null,
    goals: { water: 0, steps: false, calories: false, date: dateKey(new Date()) },
    goalTargets: { water: 8, steps: 8000, calories: 2400 },
    activeWorkout: null,
  };
}
