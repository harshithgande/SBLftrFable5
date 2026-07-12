import { firstSentence, ParseError, parseAssessment, parseComparison } from '../parser';

describe('parseAssessment', () => {
  const good = [
    'OVERVIEW',
    'You have a solid base to build from. And more text.',
    'CURRENT STRENGTHS',
    '- Consistent pressing strength',
    '- Good work capacity',
    'WHAT TO FOCUS ON',
    '- Side delts',
    '- Hamstrings',
  ].join('\n');

  it('parses well-formed responses', () => {
    const parsed = parseAssessment(good);
    expect(parsed.overview).toBe('You have a solid base to build from.');
    expect(parsed.strengths).toEqual(['Consistent pressing strength', 'Good work capacity']);
    expect(parsed.focus).toEqual(['Side delts', 'Hamstrings']);
  });

  it('tolerates markdown noise, colons and reordered sections', () => {
    const messy = [
      '**WHAT TO FOCUS ON:**',
      '* Rear delts',
      '## CURRENT STRENGTHS',
      '1. Strong lats',
      'OVERVIEW: A good starting point overall.',
    ].join('\n');
    const parsed = parseAssessment(messy);
    expect(parsed.overview).toBe('A good starting point overall.');
    expect(parsed.strengths).toEqual(['Strong lats']);
    expect(parsed.focus).toEqual(['Rear delts']);
  });

  it('throws ParseError for missing sections', () => {
    expect(() => parseAssessment('OVERVIEW\nJust an overview.')).toThrow(ParseError);
    expect(() => parseAssessment('')).toThrow(ParseError);
    expect(() => parseAssessment('complete nonsense with no headers')).toThrow(ParseError);
  });
});

describe('parseComparison', () => {
  const good = [
    'CURRENT STRENGTHS',
    '- Visible shoulder development',
    'WHAT TO FOCUS ON',
    '- Lower chest',
    'VERDICT',
    'Image 2 shows more definition than image 1, though lighting differs.',
  ].join('\n');

  it('parses all three sections including a multi-line verdict', () => {
    const parsed = parseComparison(`${good}\nProgress is real.`);
    expect(parsed.strengths).toEqual(['Visible shoulder development']);
    expect(parsed.focus).toEqual(['Lower chest']);
    expect(parsed.verdict).toContain('lighting differs');
    expect(parsed.verdict).toContain('Progress is real.');
  });

  it('throws for a missing verdict', () => {
    const noVerdict = good.split('VERDICT')[0];
    expect(() => parseComparison(noVerdict)).toThrow(ParseError);
  });
});

describe('firstSentence (Hermes-safe)', () => {
  it('extracts the first sentence without lookbehind', () => {
    expect(firstSentence('One. Two. Three.')).toBe('One.');
    expect(firstSentence('No terminator here')).toBe('No terminator here');
    expect(firstSentence('Really? Yes.')).toBe('Really?');
  });
});
