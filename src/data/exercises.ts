import { ExerciseDefinition } from '../types';

/** Single source of truth for every exercise in the app. */
export const EXERCISES: Record<string, ExerciseDefinition> = {
  'chest-fly': { id: 'chest-fly', name: 'Chest Fly', muscles: ['chest'] },
  'db-lateral-raise': { id: 'db-lateral-raise', name: 'Dumbbell Lateral Raises', muscles: ['side delts'] },
  'single-arm-tricep-ext': {
    id: 'single-arm-tricep-ext',
    name: 'Single Arm Tricep Extension',
    muscles: ['triceps'],
  },
  'incline-smith-bench': {
    id: 'incline-smith-bench',
    name: 'Incline Smith Bench',
    muscles: ['chest', 'front delts', 'triceps'],
  },
  'jm-press': { id: 'jm-press', name: 'JM Press', muscles: ['triceps'] },
  'smith-shoulder-press': {
    id: 'smith-shoulder-press',
    name: 'Smith Shoulder Press',
    muscles: ['front delts', 'side delts', 'triceps'],
  },
  'lat-pulldown': { id: 'lat-pulldown', name: 'Lat Pulldown', muscles: ['lats', 'biceps'] },
  'incline-curl': { id: 'incline-curl', name: 'Incline Curl', muscles: ['biceps'] },
  'kelso-shrug': { id: 'kelso-shrug', name: 'Kelso Shrugs', muscles: ['traps', 'upper back'] },
  'preacher-curl': { id: 'preacher-curl', name: 'Preacher Curl', muscles: ['biceps'] },
  'cg-chest-supported-row': {
    id: 'cg-chest-supported-row',
    name: 'Close Grip Chest Supported Row',
    muscles: ['upper back', 'lats', 'biceps'],
  },
  'rear-delt-fly': { id: 'rear-delt-fly', name: 'Rear Delt Fly', muscles: ['rear delts', 'upper back'] },
  'leg-extension': { id: 'leg-extension', name: 'Leg Extension', muscles: ['quads'] },
  'leg-curl': { id: 'leg-curl', name: 'Leg Curl', muscles: ['hamstrings'] },
  'leg-press': { id: 'leg-press', name: 'Leg Press', muscles: ['quads', 'glutes'] },
  sldl: { id: 'sldl', name: 'SLDL', muscles: ['hamstrings', 'glutes'] },
  'calf-raise': { id: 'calf-raise', name: 'Calf Raises', muscles: ['calves'] },
  'hip-abduction': { id: 'hip-abduction', name: 'Hip Abduction', muscles: ['abductors', 'glutes'] },
  'crunch-machine': { id: 'crunch-machine', name: 'Crunch Machine', muscles: ['core'] },
  'h2l-cg-pulldown': {
    id: 'h2l-cg-pulldown',
    name: 'High to Low Close Grip Pulldown',
    muscles: ['lats'],
  },
  'cuffed-reverse-curl': {
    id: 'cuffed-reverse-curl',
    name: 'Cuffed Cable Reverse Curl',
    muscles: ['forearms', 'biceps'],
  },
};

export function getExercise(id: string): ExerciseDefinition {
  const found = EXERCISES[id];
  if (found) return found;
  // Defensive: never crash rendering over a stale id from persisted data.
  return { id, name: id, muscles: [] };
}

export function exerciseName(id: string): string {
  return getExercise(id).name;
}
