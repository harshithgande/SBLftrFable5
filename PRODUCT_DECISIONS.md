# SBLftr — Product Decisions

This file explains the research behind the UX and where the implemented product
deliberately differs from the original screen descriptions.

## What was researched

Current (2025–2026) writing on fitness-app onboarding, paywall design and
retention, including:

- Adapty's 2026 health & fitness subscription benchmarks and paywall analyses
  (onboarding-to-paywall flow structure, trial performance, comparison tables)
- RocketShip HQ's summaries of the Adapty benchmark data for fitness apps
  (paywall timing after goal collection but before first core value delivery)
- Funnelfox / PaywallPro paywall pattern catalogs (benefit-led CTAs, plan-card
  layout, trust signals)
- UX teardowns of quiz-style onboarding (Noom-style "building your plan"
  moments, progress indicators, one-question-per-screen pacing)
- Workout-logging UX essays (Stormotion, UXmatters, Setgraph, George Wang's
  lightweight workout log) — friction budgets for logging a set between sets,
  auto-starting rest timers, smart defaults
- Apple HIG / Material guidance on tap targets, subscription disclosure
  requirements, and honest subscription UX (no fake urgency, visible decline)

Patterns studied across leading apps (Strong, Hevy, Fitbod, Noom, Whoop-style
recovery surfaces) informed *why* flows work; no branding, layout, or copy was
copied.

## Major UX decisions

1. **Quiz-style onboarding, one question per screen (9 steps).** Research
   consistently favors short, focused steps with a visible progress bar over
   dense forms. Every step explains why it's asked. Back navigation preserves
   answers; answers persist to storage each step so an interrupted setup
   resumes. One optional question (injuries/limitations) was added because it
   materially improves exercise caution; equipment questions were cut to keep
   setup ~2 minutes.

2. **Photos are the final step, clearly optional.** Users understand the value
   ("your assessment reflects what you've actually built") before any
   permission ask. The permission is pre-warmed when the step appears, the
   picker shows an immediate spinner, denial is handled with a calm path
   forward, and the AI-processing disclosure appears before anything uploads.

3. **AI plan generation happens immediately after the questions, before the
   paywall.** The "analyzing…" moment makes the personalization feel earned
   (the strongest pattern in the researched funnels), and the *full parsed
   assessment* — overview, strengths vs focus, recommended week — is revealed
   for free. Showing real value before asking for money is both more ethical
   and better-converting than a blind paywall.

4. **Paywall timing: after the plan reveal, one screen, one ask.** The user has
   just seen their personalized week; Premium is framed as "activate it". The
   decline path ("Continue with the free plan") is a full-size, always-visible
   button. The free-plan summary requested in the original spec is folded into
   the Free-vs-Premium comparison table on the same screen — clearer than a
   separate post-decline interstitial (documented modification).

5. **Paywall content:** benefit rows → comparison table → plan cards (yearly
   pre-selected with honest per-month math) → subscription terms → placeholder
   testimonials → Restore/Terms/Privacy. The star-rating and hero imagery from
   the original concept were dropped: fabricated ratings are a policy violation
   and erode trust. Testimonials ship as clearly labeled development
   placeholders, centralized in `src/data/testimonials.ts` for replacement.

6. **No fake anything.** No countdowns, no scarcity, no fabricated counts.
   Purchases are explicitly simulated in this build and the UI says so.

7. **Four tabs — Today / Plan / Progress / Profile.** The original structure
   survived research: it maps to the four user intents (act now, understand the
   program, see results, configure). Active Workout is a full-screen modal so a
   session is never more than one tap away and can't be lost in tab state.

8. **Active workout is optimized for between-sets use:** large inputs, one-tap
   completion that saves values and auto-starts the rest timer, previous
   performance inline, add/remove sets without menus, PR feedback as a
   transient banner (not a blocking modal). Draft inputs are local until a set
   is completed, so typing can never corrupt saved data and completion never
   wipes inputs. The rest timer is wall-clock (timestamp) based, immune to JS
   interval drift.

9. **Recovery is honest.** A transparent 48-hour rule with an in-app "What is
   this?" explanation, shown as per-muscle progress bars with text labels (not
   color-only). It is explicitly framed as a rule of thumb, not medical
   measurement. A custom anatomy diagram was rejected: labeled bars are more
   accessible and less pseudo-precise.

10. **Retention features are restrained:** weekly consistency ring (x of your
    own target), week streak that an in-progress week can extend but never
    break early, PR celebrations, and a gentle rest-day card. No loss-aversion
    mechanics, no guilt copy.

## Free vs Premium

Free keeps a genuinely useful product: full workout logging with rest timer and
PRs, standard splits (Upper/Lower, Push/Pull/Legs), history, weight logging with
charts, daily goals and streaks. Premium adds the science-based personalized
split assignment (fb3 / ul-fb4 / ul-fb5 / ul6 by frequency), the AI assessment,
AI before/after comparison, and the custom split builder. All gating flows
through one `PremiumGate` component + `utils/access.ts` so checks are
consistent and testable.

## Modifications from the original spec (and why)

- **Free-plan summary after declining** → merged into the paywall comparison
  table (see #4).
- **Testimonial carousel with star rating** → static, clearly-labeled example
  quotes; no rating (policy/ethics, see #5).
- **T-chart** kept, implemented as a two-column strengths/focus layout on both
  the assessment and comparison screens.
- **Long-press photo deletion** exists but every photo also has a visible
  delete affordance (discoverability requirement).
- **Added fields to AppState** (schemaVersion, onboardingComplete, limitations,
  rear photo URI, parsed assessment, lastComparison) — all typed, all covered
  by the migration/sanitize layer.
- Everything else — split schedules, exercise pools, set-default rules,
  ordering semantics, rehydration contract (activeWorkout cleared on restart) —
  follows the spec exactly and is covered by tests.
