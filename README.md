# Discipline

A personal, single-user goal-tracking PWA. Phone-first, installable to the home screen, no backend, no account. Data lives in `localStorage`; JSON export/import (Settings → Data) keeps it from being trapped in one browser.

## Views

- **Today** — only what's scheduled today. Boxing shows week progress, not a daily state. One push-back flag at a time, most consequential first. A rotating scripture verse when there's no flag.
- **Week** — a grid, days across goals down, for completion at a glance.
- **Patterns** — sleep delta over time with the other goals overlaid, bedtime correlation, day-of-week failure rates, scrolling incidence, 8-week completion trend, boxing vs. sleep, and current/longest runs.
- **Settings** — goal CRUD. Targets are versioned by effective date, so editing a goal never rewrites how past days scored.

## Data model

Goals are records (`src/types/goal.ts`), not hardcoded. Each goal type — `weekly_count`, `daily_time`, `daily_duration`, `daily_binary`, `weekly_duration`, `inverted_binary` — is evaluated by a shared engine (`src/engine/goalEngine.ts`) against a `GoalVersion` (schedule + target) that's in force on a given date, so history stays intact when targets change.

## Development

```
npm install
npm run dev      # dev server
npm run build    # typecheck + production build
npm run lint     # oxlint
```

Icons are generated from `scripts/generate-icons.mjs` (`node scripts/generate-icons.mjs`).
