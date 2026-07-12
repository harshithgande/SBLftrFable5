import { AIAssessment, ExperienceLevel, Physique } from '../types';
import { OnboardingProfile } from './prompts';

/**
 * Local assessment used when the AI request fails or no key is configured.
 * Built purely from onboarding answers — it makes no visual claims and is
 * flagged `fallback: true` so the UI can present it honestly.
 */

const EXPERIENCE_STRENGTHS: Record<ExperienceLevel, string[]> = {
  beginner: [
    'Newcomer advantage: your first year is when muscle and strength come fastest',
    'No ingrained bad habits — you can learn clean technique from day one',
  ],
  novice: [
    'You have built the gym habit — the hardest part is behind you',
    'Base levels of strength and coordination are already in place',
  ],
  intermediate: [
    'A solid strength foundation across the main movement patterns',
    'You know your way around training and can handle meaningful volume',
  ],
  advanced: [
    'Years of accumulated muscle and work capacity',
    'Well-practiced technique on the lifts that matter',
  ],
};

const GOAL_FOCUS: Record<Physique, string[]> = {
  athletic: [
    'Posterior chain: hamstrings, glutes and upper back for balanced structure',
    'Overhead and incline pressing strength',
    'Core strength that carries over to everything else',
  ],
  aesthetic: [
    'Side delts for shoulder width and the V-taper',
    'Upper chest development',
    'Lat width and arm detail',
  ],
  strongman: [
    'Heavy compound pressing and rowing volume',
    'Leg drive: quads, hamstrings and glutes',
    'Upper back and trap mass for a thick frame',
  ],
};

const OBSTACLE_FOCUS: Record<string, string> = {
  consistency: 'Keeping sessions short and repeatable so consistency comes easily',
  recovery: 'Managing volume so you recover fully between sessions',
  plateau: 'Progressive overload: adding small amounts of weight or reps each week',
  time: 'Efficient sessions built around the highest-return exercises',
};

export function buildFallbackAssessment(profile: OnboardingProfile): AIAssessment {
  const experience: ExperienceLevel = profile.experience ?? 'beginner';
  const physique: Physique = profile.physique ?? 'athletic';
  const days = profile.frequency ?? 4;

  const strengths = [...EXPERIENCE_STRENGTHS[experience]];
  strengths.push(`Committing to ${days} training days a week is a real, workable plan`);

  const focus = [...GOAL_FOCUS[physique]];
  for (const obstacle of profile.obstacles) {
    const extra = OBSTACLE_FOCUS[obstacle];
    if (extra && focus.length < 5) focus.push(extra);
  }

  const name = profile.user ? `${profile.user}, ` : '';
  const overview = `${name}your plan is built around ${days} days a week aimed squarely at your ${
    physique === 'aesthetic' ? 'physique' : physique === 'strongman' ? 'size and strength' : 'athletic'
  } goal.`;

  return { overview, strengths, focus, fallback: true, usedPhotos: false };
}
