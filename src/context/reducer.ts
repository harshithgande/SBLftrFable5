import { DAYS_IN_WEEK } from '../data/splits';
import {
  ActiveWorkout,
  AIAssessment,
  AIComparison,
  AppState,
  CustomSplit,
  DaySlot,
  ExperienceLevel,
  HistoryItem,
  Obstacle,
  Physique,
  ProgressPhoto,
  SetEntry,
  Units,
  WeightEntry,
} from '../types';
import { dateKey, simulatedNow } from '../utils/date';
import { buildWorkoutLibrary } from '../utils/ordering';
import { assignSplit } from '../utils/split';

export interface OnboardingAnswers {
  user: string;
  physique: Physique;
  experience: ExperienceLevel;
  frequency: number;
  heightFeet: number;
  heightInches: number;
  weightLbs: number;
  obstacles: Obstacle[];
  limitations: string | null;
  onboardingPhotoUri: string | null;
  onboardingRearPhotoUri: string | null;
}

export type Action =
  | { type: 'HYDRATE'; state: AppState }
  | { type: 'SAVE_ONBOARDING_ANSWERS'; answers: Partial<OnboardingAnswers> }
  | { type: 'SET_ASSESSMENT'; assessment: AIAssessment; gptPlan: string | null }
  | { type: 'COMPLETE_ONBOARDING'; premium: boolean }
  | { type: 'SET_PREMIUM'; premium: boolean }
  | { type: 'SET_UNITS'; units: Units }
  | { type: 'SET_REST_DEFAULT'; seconds: number }
  | { type: 'SET_DEV_MODE'; enabled: boolean }
  | { type: 'SET_DEV_OFFSET'; days: number }
  | { type: 'SELECT_SPLIT'; splitId: string; schedule: DaySlot[] }
  | { type: 'SAVE_CUSTOM_SPLIT'; split: CustomSplit }
  | { type: 'DELETE_CUSTOM_SPLIT'; id: string }
  | { type: 'START_WORKOUT'; workout: ActiveWorkout }
  | { type: 'UPDATE_SET'; exerciseIndex: number; setIndex: number; patch: Partial<SetEntry> }
  | { type: 'ADD_SET'; exerciseIndex: number }
  | { type: 'REMOVE_SET'; exerciseIndex: number; setIndex: number }
  | { type: 'FINISH_WORKOUT'; item: HistoryItem }
  | { type: 'CANCEL_WORKOUT' }
  | { type: 'DELETE_HISTORY'; id: string }
  | { type: 'LOG_WEIGHT'; entry: WeightEntry }
  | { type: 'DELETE_WEIGHT'; id: string }
  | { type: 'ADD_PHOTO'; photo: ProgressPhoto }
  | { type: 'DELETE_PHOTO'; id: string }
  | { type: 'SET_COMPARISON'; comparison: AIComparison | null }
  | { type: 'ADD_WATER'; delta: number }
  | { type: 'TOGGLE_GOAL'; goal: 'steps' | 'calories' }
  | { type: 'SET_GOAL_TARGETS'; targets: Partial<AppState['goalTargets']> }
  | { type: 'ENSURE_GOALS_FRESH' }
  | { type: 'INJECT_TEST_DATA'; patch: Partial<AppState> }
  | { type: 'RESET_APP'; state: AppState };

function withFreshGoals(state: AppState): AppState {
  const today = dateKey(simulatedNow(state.devOffset));
  if (state.goals.date === today) return state;
  return { ...state, goals: { water: 0, steps: false, calories: false, date: today } };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return withFreshGoals(action.state);

    case 'SAVE_ONBOARDING_ANSWERS': {
      // Skip undefined entries so partially-answered steps never clobber
      // previously saved answers.
      const patch: Partial<AppState> = {};
      for (const [key, value] of Object.entries(action.answers)) {
        if (value !== undefined) (patch as Record<string, unknown>)[key] = value;
      }
      return { ...state, ...patch };
    }

    case 'SET_ASSESSMENT':
      return { ...state, assessment: action.assessment, gptPlan: action.gptPlan };

    case 'COMPLETE_ONBOARDING': {
      const assignment = assignSplit(action.premium, state.frequency);
      return {
        ...state,
        onboardingComplete: true,
        premium: action.premium,
        split: assignment.split,
        schedule: assignment.schedule,
        personalizedSplitId: assignment.personalizedSplitId,
        workouts: buildWorkoutLibrary(state.physique),
      };
    }

    case 'SET_PREMIUM': {
      if (action.premium === state.premium) return state;
      if (!action.premium) {
        // Downgrade: fall back to the free split when a premium schedule was active.
        const assignment = assignSplit(false, state.frequency);
        return {
          ...state,
          premium: false,
          personalizedSplitId: null,
          split: assignment.split,
          schedule: assignment.schedule,
        };
      }
      const assignment = assignSplit(true, state.frequency);
      return {
        ...state,
        premium: true,
        personalizedSplitId: assignment.personalizedSplitId,
        split: assignment.split,
        schedule: assignment.schedule,
      };
    }

    case 'SET_UNITS':
      return { ...state, units: action.units };

    case 'SET_REST_DEFAULT':
      return { ...state, restDefault: Math.max(15, Math.min(600, Math.round(action.seconds))) };

    case 'SET_DEV_MODE':
      return { ...state, devMode: action.enabled, devOffset: action.enabled ? state.devOffset : 0 };

    case 'SET_DEV_OFFSET':
      return withFreshGoals({ ...state, devOffset: Math.round(action.days) });

    case 'SELECT_SPLIT': {
      if (action.schedule.length !== DAYS_IN_WEEK) return state;
      return { ...state, split: action.splitId, schedule: [...action.schedule] };
    }

    case 'SAVE_CUSTOM_SPLIT': {
      if (action.split.days.length !== DAYS_IN_WEEK) return state;
      const existing = state.customSplits.findIndex((s) => s.id === action.split.id);
      const customSplits =
        existing === -1
          ? [...state.customSplits, action.split]
          : state.customSplits.map((s) => (s.id === action.split.id ? action.split : s));
      return { ...state, customSplits };
    }

    case 'DELETE_CUSTOM_SPLIT': {
      const customSplits = state.customSplits.filter((s) => s.id !== action.id);
      return { ...state, customSplits };
    }

    case 'START_WORKOUT':
      return { ...state, activeWorkout: action.workout };

    case 'UPDATE_SET': {
      if (!state.activeWorkout) return state;
      const exercises = state.activeWorkout.exercises.map((ex, ei) =>
        ei !== action.exerciseIndex
          ? ex
          : {
              ...ex,
              sets: ex.sets.map((s, si) => (si !== action.setIndex ? s : { ...s, ...action.patch })),
            }
      );
      return { ...state, activeWorkout: { ...state.activeWorkout, exercises } };
    }

    case 'ADD_SET': {
      if (!state.activeWorkout) return state;
      const exercises = state.activeWorkout.exercises.map((ex, ei) => {
        if (ei !== action.exerciseIndex) return ex;
        const last = ex.sets[ex.sets.length - 1];
        const fresh: SetEntry = {
          id: `${ex.exerciseId}-${ex.sets.length}-${Date.now()}`,
          weightLbs: last ? last.weightLbs : 0,
          reps: last ? last.reps : 0,
          completed: false,
        };
        return { ...ex, sets: [...ex.sets, fresh] };
      });
      return { ...state, activeWorkout: { ...state.activeWorkout, exercises } };
    }

    case 'REMOVE_SET': {
      if (!state.activeWorkout) return state;
      const exercises = state.activeWorkout.exercises.map((ex, ei) => {
        if (ei !== action.exerciseIndex || ex.sets.length <= 1) return ex;
        return { ...ex, sets: ex.sets.filter((_, si) => si !== action.setIndex) };
      });
      return { ...state, activeWorkout: { ...state.activeWorkout, exercises } };
    }

    case 'FINISH_WORKOUT':
      // History is stored newest first.
      return { ...state, history: [action.item, ...state.history], activeWorkout: null };

    case 'CANCEL_WORKOUT':
      return { ...state, activeWorkout: null };

    case 'DELETE_HISTORY':
      return { ...state, history: state.history.filter((h) => h.id !== action.id) };

    case 'LOG_WEIGHT': {
      // Weight log is stored newest first; same-day entries keep insertion recency.
      const weightLog = [action.entry, ...state.weightLog].sort(
        (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
      );
      return { ...state, weightLog };
    }

    case 'DELETE_WEIGHT':
      return { ...state, weightLog: state.weightLog.filter((w) => w.id !== action.id) };

    case 'ADD_PHOTO':
      return { ...state, photos: [action.photo, ...state.photos] };

    case 'DELETE_PHOTO':
      return { ...state, photos: state.photos.filter((p) => p.id !== action.id) };

    case 'SET_COMPARISON':
      return { ...state, lastComparison: action.comparison };

    case 'ADD_WATER': {
      const fresh = withFreshGoals(state);
      const water = Math.max(0, fresh.goals.water + action.delta);
      return { ...fresh, goals: { ...fresh.goals, water } };
    }

    case 'TOGGLE_GOAL': {
      const fresh = withFreshGoals(state);
      return {
        ...fresh,
        goals: { ...fresh.goals, [action.goal]: !fresh.goals[action.goal] },
      };
    }

    case 'SET_GOAL_TARGETS':
      return { ...state, goalTargets: { ...state.goalTargets, ...action.targets } };

    case 'ENSURE_GOALS_FRESH':
      return withFreshGoals(state);

    case 'INJECT_TEST_DATA':
      return withFreshGoals({ ...state, ...action.patch });

    case 'RESET_APP':
      return action.state;

    default:
      return state;
  }
}
