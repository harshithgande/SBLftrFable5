import { formatWeight, fromDisplayWeight, lbsToKg, kgToLbs, parseNumericInput, toDisplayWeight } from '../units';

describe('unit conversion', () => {
  it('converts between kg and lbs', () => {
    expect(lbsToKg(220.462)).toBeCloseTo(100, 3);
    expect(kgToLbs(100)).toBeCloseTo(220.462, 3);
  });

  it('round-trips display values', () => {
    const lbs = fromDisplayWeight(80, 'kg');
    expect(toDisplayWeight(lbs, 'kg')).toBeCloseTo(80, 1);
    expect(fromDisplayWeight(165, 'lb')).toBe(165);
  });

  it('formats weights in the selected unit', () => {
    expect(formatWeight(165, 'lb')).toBe('165 lb');
    expect(formatWeight(220.46, 'kg')).toBe('100 kg');
    expect(formatWeight(165, 'lb', false)).toBe('165');
  });

  it('parses numeric input defensively', () => {
    expect(parseNumericInput('82.5')).toBe(82.5);
    expect(parseNumericInput('82,5')).toBe(82.5);
    expect(parseNumericInput(' 12 ')).toBe(12);
    expect(parseNumericInput('')).toBeNull();
    expect(parseNumericInput('abc')).toBeNull();
    expect(parseNumericInput('-5')).toBeNull();
  });
});
