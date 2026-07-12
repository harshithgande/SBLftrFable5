import { OPENAI_API_KEY } from '../constants';

/**
 * OpenAI REST client. This is the ONLY file that may reference model names or
 * the API key. Model identifiers must never appear in UI copy or user-facing
 * strings.
 *
 * SECURITY NOTE: calling OpenAI directly from a client app cannot fully
 * protect the key; this pattern is for local development/prototyping only.
 * Production must proxy through a backend. See src/constants.example.ts.
 */

const API_URL = 'https://api.openai.com/v1/chat/completions';
const VISION_MODEL = 'gpt-4o';
const TEXT_MODEL = 'gpt-4o-mini';
const DEFAULT_TIMEOUT_MS = 45000;

export type AIErrorKind = 'no-key' | 'timeout' | 'rate-limit' | 'http' | 'network' | 'malformed' | 'cancelled';

export class AIError extends Error {
  kind: AIErrorKind;

  constructor(kind: AIErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

export function hasApiKey(): boolean {
  return (
    typeof OPENAI_API_KEY === 'string' &&
    OPENAI_API_KEY.startsWith('sk-') &&
    !OPENAI_API_KEY.includes('REPLACE_ME')
  );
}

type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail: 'low' | 'high' } };

export interface ChatRequest {
  prompt: string;
  /** base64 data-URLs; presence switches to the vision-capable model. */
  images?: string[];
  timeoutMs?: number;
  signal?: AbortSignal;
}

/**
 * Run a chat completion and return the raw text content.
 * Throws AIError for every failure mode so callers can branch on `kind`.
 */
export async function chatCompletion(request: ChatRequest): Promise<string> {
  if (!hasApiKey()) {
    throw new AIError('no-key', 'No API key configured');
  }

  const images = request.images ?? [];
  const parts: ContentPart[] = [{ type: 'text', text: request.prompt }];
  for (const url of images) {
    parts.push({ type: 'image_url', image_url: { url, detail: 'low' } });
  }

  const body = JSON.stringify({
    model: images.length > 0 ? VISION_MODEL : TEXT_MODEL,
    messages: [{ role: 'user', content: parts }],
    max_tokens: 700,
    temperature: 0.4,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), request.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const onOuterAbort = () => controller.abort();
  request.signal?.addEventListener('abort', onOuterAbort);

  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body,
      signal: controller.signal,
    });
  } catch (err) {
    if (request.signal?.aborted) throw new AIError('cancelled', 'Request cancelled');
    if (controller.signal.aborted) throw new AIError('timeout', 'Request timed out');
    throw new AIError('network', err instanceof Error ? err.message : 'Network error');
  } finally {
    clearTimeout(timeout);
    request.signal?.removeEventListener('abort', onOuterAbort);
  }

  if (response.status === 429) throw new AIError('rate-limit', 'Rate limited');
  if (!response.ok) {
    // Never log request bodies here: they can contain private photo payloads.
    throw new AIError('http', `Request failed (${response.status})`);
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new AIError('malformed', 'Response was not valid JSON');
  }

  const content = extractContent(json);
  if (content === null) throw new AIError('malformed', 'Response had no content');
  return content;
}

function extractContent(json: unknown): string | null {
  if (typeof json !== 'object' || json === null) return null;
  const choices = (json as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const message = (choices[0] as { message?: unknown }).message;
  if (typeof message !== 'object' || message === null) return null;
  const content = (message as { content?: unknown }).content;
  return typeof content === 'string' && content.trim() !== '' ? content : null;
}

/** User-safe error copy — no model names, no status internals. */
export function aiErrorMessage(err: unknown): string {
  if (err instanceof AIError) {
    switch (err.kind) {
      case 'no-key':
        return 'AI features need a developer API key. Using your built-in plan instead.';
      case 'timeout':
        return 'The analysis took too long. Check your connection and try again.';
      case 'rate-limit':
        return 'Our analysis service is busy right now. Please try again in a minute.';
      case 'cancelled':
        return 'Analysis cancelled.';
      case 'network':
        return 'Could not reach the analysis service. Check your connection and try again.';
      default:
        return 'Something went wrong while generating your analysis. Please try again.';
    }
  }
  return 'Something went wrong while generating your analysis. Please try again.';
}
