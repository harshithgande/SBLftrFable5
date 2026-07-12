# SBLftr

A science-based workout tracking app with AI-personalized training plans.
Built with Expo SDK 54, React Native, TypeScript (strict), React Navigation 7,
AsyncStorage + useReducer/Context, and react-native-svg.

## Features

- **Quiz-style onboarding** — goal, experience, schedule, obstacles, optional
  progress photos; ~2 minutes, resumable, no account required
- **AI assessment** — strengths and focus areas generated from your profile
  (and photos when provided), with a local fallback when offline
- **Science-based splits** — personalized 7-day schedules by training
  frequency (Premium) plus standard Upper/Lower and Push/Pull/Legs
- **Fast workout logging** — set-by-set weight/reps, auto-starting rest timer,
  previous-performance hints, personal-record detection
- **Progress tracking** — weight log with SVG trend chart, workout history,
  progress photos, AI before/after comparison (Premium)
- **Today dashboard** — workout of the day, weekly consistency, daily goals,
  transparent muscle-recovery hints
- **Custom split builder** (Premium) — design, save and activate your own week

## Setup

```bash
npm install
cp src/constants.example.ts src/constants.ts   # then add your OpenAI API key
npx expo start
```

The app runs without a key — AI features fall back to a built-in plan and say
so honestly in the UI.

### ⚠️ API key security

`src/constants.ts` is **gitignored and must never be committed**. Calling
OpenAI directly from a mobile client can never fully protect a secret key —
anyone with the binary can extract it. This setup is acceptable **only for
local development and prototyping**. A production release must proxy AI
requests through a secure backend that holds the key server-side. See
`src/constants.example.ts` and `docs/DEVELOPMENT.md`.

## Scripts

| Command             | Purpose                          |
| ------------------- | -------------------------------- |
| `npm start`         | Expo dev server                  |
| `npm run typecheck` | TypeScript (strict) validation   |
| `npm run lint`      | ESLint                           |
| `npm test`          | Jest test suite                  |

## Project structure

```text
src/
  components/   Design-system components (Button, Card, Sheet, charts, gates…)
  constants.ts  Local-only API key (gitignored; copy from constants.example.ts)
  context/      App state: typed reducer + Context provider
  data/         Exercises, workout pools, splits, goal priorities, testimonials
  hooks/        useRestTimer (wall-clock based)
  navigation/   Typed React Navigation 7 stacks + tabs
  screens/      All screens, including onboarding/
  services/     OpenAI REST client, prompts, parsers, fallback, photo handling
  storage/      AsyncStorage persistence, schema migrations, default state
  theme/        Design tokens: colors, type, spacing, radii, shadows
  types/        Shared domain types
  utils/        Splits, ordering, PRs, volume, recovery, streaks, units, dates
```

## Development notes

- Hermes-safe: no regex lookbehind anywhere.
- Purchases are **simulated** — no billing SDK is wired up (see
  `docs/DEVELOPMENT.md`).
- Developer mode: tap the profile avatar 7 times → date simulation, test-data
  injection, premium toggle.
- Product/UX rationale: see `PRODUCT_DECISIONS.md`.
