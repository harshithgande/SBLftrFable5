import { AIAssessment, AIComparison } from '../types';
import { chatCompletion } from './openai';
import { parseAssessment, parseComparison } from './parser';
import {
  assessmentNoPhotosPrompt,
  assessmentWithPhotosPrompt,
  comparisonPrompt,
  OnboardingProfile,
} from './prompts';

/** High-level AI flows. Throws AIError / ParseError; callers own fallback UX. */

export async function generateAssessment(
  profile: OnboardingProfile,
  photoDataUrls: string[],
  signal?: AbortSignal
): Promise<AIAssessment> {
  const usePhotos = photoDataUrls.length > 0;
  const prompt = usePhotos ? assessmentWithPhotosPrompt(profile) : assessmentNoPhotosPrompt(profile);
  const raw = await chatCompletion({
    prompt,
    images: usePhotos ? photoDataUrls : undefined,
    signal,
  });
  const parsed = parseAssessment(raw);
  return { ...parsed, fallback: false, usedPhotos: usePhotos };
}

export async function generateComparison(
  beforeDataUrl: string,
  afterDataUrl: string,
  signal?: AbortSignal
): Promise<AIComparison> {
  const raw = await chatCompletion({
    prompt: comparisonPrompt(),
    images: [beforeDataUrl, afterDataUrl],
    signal,
  });
  const parsed = parseComparison(raw);
  return { ...parsed, dateISO: new Date().toISOString() };
}
