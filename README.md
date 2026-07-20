# Goal Tracker

A personal goal-tracking PWA. Single user, no auth, phone-first. Daily check-in in under 30 seconds.

## Stack

- React + TypeScript (strict) + Vite
- Zustand for state, localStorage for persistence (no backend)
- `vite-plugin-pwa` for the manifest + service worker (installable, offline-capable)
- Hand-rolled SVG charts for Patterns (no charting library)
- Vitest for the engine layer

## Architecture

Goals are data, not hardcoded — each has a type (`weekly_count`, `daily_time`, `daily_duration`,
`daily_binary`, `weekly_duration`, `inverted_binary`), a weekday schedule, and an active date range.
Targets are versioned by effective date (`src/engine/targetResolution.ts`): editing a goal's target
appends a new version rather than mutating history, so past weeks keep evaluating against the rules
that were actually in force at the time.

`src/engine/**` is pure — no React, no DOM, no storage imports — so the versioning, tri-state
weekly evaluation, streak, and push-back logic is unit-tested in isolation (`npm run test`).

- `src/engine/` — goal types, date math, target resolution, per-day/per-week evaluation, streaks,
  push-back flags, scripture verses, seed data
- `src/storage/` — localStorage wrapper (debounced writes, corruption fallback), schema/migrations,
  JSON export/import
- `src/state/` — the Zustand store
- `src/components/` + `src/routes/` — Today, Week, Settings, Patterns views

## Development

```sh
npm install
npm run dev       # start the dev server
npm run test      # run the engine test suite
npm run build     # typecheck + production build
npm run preview   # serve the production build locally
```

## Deployment

Pushing to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`. The Vite
`base` path in `vite.config.ts` is set to `/Habit-tracker/` to match the Pages URL — update it if the
repo is ever renamed or moved.
