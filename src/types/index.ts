/** Core domain types shared across the app. */

export type Physique = 'athletic' | 'aesthetic' | 'strongman';

export type ExperienceLevel = 'beginner' | 'novice' | 'intermediate' | 'advanced';

export type WorkoutType = 'push' | 'pull' | 'lower' | 'upper' | 'full';

/** One slot of a seven-day schedule: a workout type or a rest day. */
export type DaySlot = WorkoutType | 'rest';

export type MuscleGroup =
  | 'chest'
  | 'front delts'
  | 'side delts'
  | 'rear delts'
  | 'triceps'
  | 'biceps'
  | 'forearms'
  | 'lats'
  | 'upper back'
  | 'traps'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'abductors'
  | 'core';

export type Obstacle =
  | 'consistency'
  | 'diet'
  | 'motivation'
  | 'time'
  | 'knowledge'
  | 'recovery'
  | 'plateau'
  | 'no-gym';

export type Units = 'kg' | 'lb';

export interface ExerciseDefinition {
  id: string;
  name: string;
  muscles: MuscleGroup[];
}

export interface WorkoutExercise {
  exerciseId: string;
  /** Default number of working sets for this exercise in this workout. */
  sets: number;
}

export interface WorkoutDefinition {
  id: string;
  type: WorkoutType;
  name: string;
  exercises: WorkoutExercise[];
}

export interface SplitDefinition {
  id: string;
  name: string;
  description: string;
  /** Exactly seven entries, Monday first. */
  schedule: DaySlot[];
  daysPerWeek: number;
  premium: boolean;
}

export interface CustomSplitDay {
  name: string;
  type: DaySlot;
}

export interface CustomSplit {
  id: string;
  name: string;
  /** Exactly seven entries, Monday first. */
  days: CustomSplitDay[];
}

export interface SetEntry {
  id: string;
  weightLbs: number;
  reps: number;
  completed: boolean;
}

export interface ActiveExercise {
  exerciseId: string;
  name: string;
  sets: SetEntry[];
}

export interface ActiveWorkout {
  id: string;
  type: WorkoutType;
  name: string;
  startedAt: string;
  exercises: ActiveExercise[];
}

export type PRKind = 'weight' | 'reps' | 'e1rm';

export interface PRRecord {
  exerciseId: string;
  exerciseName: string;
  kind: PRKind;
  weightLbs: number;
  reps: number;
}

export interface HistorySet {
  weightLbs: number;
  reps: number;
}

export interface HistoryExercise {
  exerciseId: string;
  name: string;
  sets: HistorySet[];
  /** Best single set of the session by estimated 1RM. */
  bestWeightLbs: number;
  bestReps: number;
}

export interface HistoryItem {
  id: string;
  dateISO: string;
  type: WorkoutType;
  name: string;
  durationSec: number | null;
  totalVolumeLbs: number;
  exercises: HistoryExercise[];
  prs: PRRecord[];
}

export interface WeightEntry {
  id: string;
  dateISO: string;
  weightLbs: number;
}

export type PhotoPose = 'front' | 'rear-double-bicep' | 'progress';

export interface ProgressPhoto {
  id: string;
  uri: string;
  dateISO: string;
  pose: PhotoPose;
}

export interface DailyGoals {
  water: number;
  steps: boolean;
  calories: boolean;
  /** Local date key (YYYY-MM-DD) the counters belong to. */
  date: string;
}

export interface GoalTargets {
  water: number;
  steps: number;
  calories: number;
}

export interface AIAssessment {
  overview: string;
  strengths: string[];
  focus: string[];
  /** True when generated locally because the AI request failed or no key was set. */
  fallback: boolean;
  /** True when progress photos informed the assessment. */
  usedPhotos: boolean;
}

export interface AIComparison {
  strengths: string[];
  focus: string[];
  verdict: string;
  dateISO: string;
}

export interface AppState {
  /** Bump when the persisted shape changes; see src/storage/migrations. */
  schemaVersion: number;
  onboardingComplete: boolean;
  user: string | null;
  physique: Physique | null;
  experience: ExperienceLevel | null;
  frequency: number | null;
  heightFeet: number | null;
  heightInches: number | null;
  weightLbs: number | null;
  obstacles: Obstacle[];
  /** Optional injury / limitation note collected during onboarding. */
  limitations: string | null;
  onboardingPhotoUri: string | null;
  onboardingRearPhotoUri: string | null;
  gptPlan: string | null;
  assessment: AIAssessment | null;
  personalizedSplitId: string | null;
  premium: boolean;
  units: Units;
  restDefault: number;
  devMode: boolean;
  devOffset: number;
  split: string;
  schedule: DaySlot[];
  workouts: Record<string, WorkoutDefinition>;
  customSplits: CustomSplit[];
  history: HistoryItem[];
  weightLog: WeightEntry[];
  photos: ProgressPhoto[];
  lastComparison: AIComparison | null;
  goals: DailyGoals;
  goalTargets: GoalTargets;
  activeWorkout: ActiveWorkout | null;
}
