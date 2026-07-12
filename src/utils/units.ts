import { Units } from '../types';

const LBS_PER_KG = 2.20462;

export function lbsToKg(lbs: number): number {
  return lbs / LBS_PER_KG;
}

export function kgToLbs(kg: number): number {
  return kg * LBS_PER_KG;
}

/** Convert a canonical-lbs value into the user's display unit. */
export function toDisplayWeight(weightLbs: number, units: Units): number {
  const value = units === 'kg' ? lbsToKg(weightLbs) : weightLbs;
  return Math.round(value * 10) / 10;
}

/** Convert a value typed in the user's unit back to canonical lbs. */
export function fromDisplayWeight(value: number, units: Units): number {
  const lbs = units === 'kg' ? kgToLbs(value) : value;
  return Math.round(lbs * 100) / 100;
}

export function formatWeight(weightLbs: number, units: Units, withUnit = true): string {
  const v = toDisplayWeight(weightLbs, units);
  const text = Number.isInteger(v) ? `${v}` : v.toFixed(1);
  return withUnit ? `${text} ${units}` : text;
}

/** Parse free-typed numeric input; returns null when unusable. */
export function parseNumericInput(text: string): number | null {
  const cleaned = text.replace(',', '.').trim();
  if (cleaned === '') return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}
