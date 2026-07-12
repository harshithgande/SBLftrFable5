/**
 * Defensive parsers for AI plain-text responses. The model is instructed to
 * return uppercase section headers; these parsers tolerate extra whitespace,
 * stray markdown tokens, missing bullets, and reordered sections. They throw
 * ParseError only when a required section is entirely absent so callers can
 * fall back gracefully.
 */

export class ParseError extends Error {}

export interface ParsedAssessment {
  overview: string;
  strengths: string[];
  focus: string[];
}

export interface ParsedComparison {
  strengths: string[];
  focus: string[];
  verdict: string;
}

/** Strip markdown tokens the model might emit despite instructions. */
function clean(line: string): string {
  return line
    .replace(/^[-*•·]+\s*/, '')
    .replace(/^\d+[.)]\s*/, '')
    .replace(/[*_`#]+/g, '')
    .trim();
}

/** Split raw text into sections keyed by any of the given uppercase headers. */
function splitSections(raw: string, headers: string[]): Map<string, string[]> {
  const sections = new Map<string, string[]>();
  let current: string | null = null;
  for (const rawLine of raw.split('\n')) {
    const line = rawLine.trim();
    if (line === '') continue;
    const headerProbe = clean(line).replace(/:$/, '').toUpperCase();
    const matched = headers.find((h) => headerProbe === h || headerProbe.startsWith(`${h}:`));
    if (matched) {
      current = matched;
      if (!sections.has(matched)) sections.set(matched, []);
      // Header and content on one line: "OVERVIEW: You have a solid base."
      const inline = clean(line).slice(matched.length).replace(/^:\s*/, '').trim();
      if (inline) sections.get(matched)?.push(inline);
      continue;
    }
    if (current) sections.get(current)?.push(clean(line));
  }
  return sections;
}

function bullets(lines: string[] | undefined): string[] {
  return (lines ?? []).map((l) => l.trim()).filter((l) => l.length > 2);
}

/** First sentence of a block — Hermes-safe (no lookbehind). */
export function firstSentence(text: string): string {
  const match = /^([^.!?]*[.!?])[\s\S]*$/.exec(text.trim());
  return (match ? match[1] : text).trim();
}

export function parseAssessment(raw: string): ParsedAssessment {
  if (typeof raw !== 'string' || raw.trim() === '') throw new ParseError('Empty response');
  const sections = splitSections(raw, ['OVERVIEW', 'CURRENT STRENGTHS', 'WHAT TO FOCUS ON']);

  const overviewLines = sections.get('OVERVIEW');
  const strengths = bullets(sections.get('CURRENT STRENGTHS'));
  const focus = bullets(sections.get('WHAT TO FOCUS ON'));

  if (!overviewLines || overviewLines.length === 0) throw new ParseError('Missing OVERVIEW');
  if (strengths.length === 0) throw new ParseError('Missing CURRENT STRENGTHS');
  if (focus.length === 0) throw new ParseError('Missing WHAT TO FOCUS ON');

  return { overview: firstSentence(overviewLines.join(' ')), strengths, focus };
}

export function parseComparison(raw: string): ParsedComparison {
  if (typeof raw !== 'string' || raw.trim() === '') throw new ParseError('Empty response');
  const sections = splitSections(raw, ['CURRENT STRENGTHS', 'WHAT TO FOCUS ON', 'VERDICT']);

  const strengths = bullets(sections.get('CURRENT STRENGTHS'));
  const focus = bullets(sections.get('WHAT TO FOCUS ON'));
  const verdictLines = sections.get('VERDICT');

  if (strengths.length === 0) throw new ParseError('Missing CURRENT STRENGTHS');
  if (focus.length === 0) throw new ParseError('Missing WHAT TO FOCUS ON');
  if (!verdictLines || verdictLines.length === 0) throw new ParseError('Missing VERDICT');

  return { strengths, focus, verdict: verdictLines.join(' ').trim() };
}
