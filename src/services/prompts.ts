import { AppState, Physique } from '../types';

/**
 * All AI prompts live here. Model names must never leak into UI copy —
 * they exist only in src/services/openai.ts.
 */

const PHYSIQUE_LABELS: Record<Physique, string> = {
  athletic: 'Athletic / Functional',
  aesthetic: 'Aesthetic / Physique',
  strongman: 'Powerhouse / Size',
};

const SHARED_SAFETY = [
  'You are a supportive, evidence-based strength coach.',
  'Never diagnose medical conditions.',
  'Never estimate exact body-fat percentage; if body composition is relevant, describe it only as a broad, clearly uncertain range.',
  'Never use insulting, shaming, or negative language about the person\'s body; frame weaknesses as training opportunities.',
  'Do not draw sensitive conclusions (age, health status, ethnicity) from appearance.',
  'Respond in PLAIN TEXT ONLY: no markdown, no asterisks, no numbered headings. Use "- " for bullets.',
].join(' ');

function profileBlock(state: OnboardingProfile): string {
  const height =
    state.heightFeet !== null && state.heightInches !== null
      ? `${state.heightFeet}ft ${state.heightInches}in`
      : 'not provided';
  const lines = [
    `Name: ${state.user ?? 'not provided'}`,
    `Goal physique: ${state.physique ? PHYSIQUE_LABELS[state.physique] : 'not provided'}`,
    `Experience: ${state.experience ?? 'not provided'}`,
    `Height: ${height}`,
    `Starting weight: ${state.weightLbs !== null ? `${state.weightLbs} lbs` : 'not provided'}`,
    `Training days per week: ${state.frequency ?? 'not provided'}`,
    `Self-reported obstacles: ${state.obstacles.length > 0 ? state.obstacles.join(', ') : 'none listed'}`,
  ];
  if (state.limitations) {
    lines.push(
      `Injuries or limitations (be cautious, suggest training around them, no medical advice): ${state.limitations}`
    );
  }
  return lines.join('\n');
}

export type OnboardingProfile = Pick<
  AppState,
  | 'user'
  | 'physique'
  | 'experience'
  | 'frequency'
  | 'heightFeet'
  | 'heightInches'
  | 'weightLbs'
  | 'obstacles'
  | 'limitations'
>;

const ASSESSMENT_FORMAT = [
  'Return EXACTLY these three sections, in this order, using these exact uppercase headers on their own lines:',
  'OVERVIEW',
  'One single sentence.',
  'CURRENT STRENGTHS',
  'A bullet list ("- " prefix) of strengths.',
  'WHAT TO FOCUS ON',
  'A bullet list ("- " prefix) of specific muscle groups or training priorities.',
].join('\n');

/** Assessment prompt when the user provided progress photos. */
export function assessmentWithPhotosPrompt(profile: OnboardingProfile): string {
  return [
    SHARED_SAFETY,
    'Analyze the attached physique photo(s) together with this training profile and produce an initial assessment.',
    'Base CURRENT STRENGTHS on visible muscular development. Base WHAT TO FOCUS ON on the muscle groups that appear least developed relative to the stated goal.',
    'If lighting, pose, or image quality limit what you can see, say so briefly rather than guessing.',
    '',
    profileBlock(profile),
    '',
    ASSESSMENT_FORMAT,
  ].join('\n');
}

/** Assessment prompt when no photos were provided — inference only, no fabricated visual claims. */
export function assessmentNoPhotosPrompt(profile: OnboardingProfile): string {
  return [
    SHARED_SAFETY,
    'No photos are available. You CANNOT see this person. Do not claim to observe any physical characteristic.',
    'Instead, infer likely strengths and sensible training priorities from the profile alone (experience level, goal, schedule, obstacles), and phrase them as inferences ("With a year of training, your pressing base is likely...").',
    '',
    profileBlock(profile),
    '',
    ASSESSMENT_FORMAT,
  ].join('\n');
}

/** Progress comparison prompt for two labeled photos. */
export function comparisonPrompt(): string {
  return [
    SHARED_SAFETY,
    'You will receive two physique photos. IMAGE 1 = BEFORE. IMAGE 2 = AFTER.',
    'Return EXACTLY these three sections, in this order, using these exact uppercase headers on their own lines:',
    'CURRENT STRENGTHS',
    'A bullet list ("- " prefix) describing the CURRENT condition shown in IMAGE 2 only.',
    'WHAT TO FOCUS ON',
    'A bullet list ("- " prefix) of muscle groups or qualities to prioritize based on the CURRENT condition in IMAGE 2 only.',
    'VERDICT',
    'A short paragraph that explicitly compares IMAGE 1 with IMAGE 2.',
    'Verdict rules: be honest, not default-positive. If IMAGE 2 shows less definition, more body fat, or reduced muscle than IMAGE 1, state the regression plainly but respectfully and frame the path forward.',
    'If lighting, pose, camera angle, distance, clothing, or image quality make the comparison unreliable, say so explicitly in the verdict and lower your confidence.',
  ].join('\n');
}
