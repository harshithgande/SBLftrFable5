/**
 * SECURITY SETUP — READ BEFORE RUNNING
 *
 * 1. Copy this file to `src/constants.ts`.
 * 2. Replace the placeholder below with your OpenAI API key.
 * 3. `src/constants.ts` is listed in .gitignore and must NEVER be committed.
 *
 * IMPORTANT PRODUCTION NOTE:
 * Shipping an API key inside a client application can never fully protect it —
 * anyone with the app binary can extract it. This direct-from-device pattern is
 * acceptable ONLY for local development and prototyping. A production release
 * must route AI requests through a secure backend proxy that holds the key
 * server-side, enforces auth and rate limits, and strips abuse.
 */
export const OPENAI_API_KEY = 'sk-REPLACE_ME_WITH_YOUR_KEY';
