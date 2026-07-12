# Development Guide

## API key

Copy `src/constants.example.ts` to `src/constants.ts` and insert your OpenAI
key. The file is gitignored; CI and reviewers must never see a real key.

**Production note:** a client-held key is extractable from any shipped binary.
Before release, move all AI calls behind a backend proxy (key server-side,
per-user auth, rate limiting). The in-app service layer (`src/services/openai.ts`)
is the single integration point to swap.

## Mock purchases

`PaywallScreen.purchase()` is a **development mock**: it shows an explicit
"Simulated purchase" dialog and flips the premium flag. No StoreKit / Play
Billing code exists yet. Before release:

1. Integrate real IAP (e.g. RevenueCat or expo-iap).
2. Replace the mock in `PaywallScreen` and the dev-panel premium toggle.
3. Wire "Restore Purchases" to the real restore flow.
4. Replace the placeholder prices and the placeholder testimonials in
   `src/data/testimonials.ts` (or remove them) — they are clearly labeled
   development stand-ins and must not ship.

## Developer mode

Tap the profile avatar 7 times on the Profile tab:

- **Simulated date** — shifts "now" by whole days everywhere (workout of the
  day, goal resets, weight/history timestamps).
- **Inject test data** — adds three weeks of synthetic sessions and weigh-ins.
- **Premium toggle** — flips premium for testing both tiers.

## Testing

`npm test` runs Jest (jest-expo preset). Covered high-risk logic: split
assignment, schedule validation, workout-of-the-day + date simulation, unit
conversion, weight-log ordering, AI parsing (incl. malformed responses),
exercise ordering, set defaults, volume, PR detection, feature access, state
migration, AsyncStorage rehydration, and goal-date resets.

## AI model usage

Model identifiers live only in `src/services/openai.ts` and must never appear
in UI copy: the vision-capable model is used when photos are attached, the
text model otherwise.
