# Ledger

A personal goal-tracking PWA. Single user, no auth, phone-first — install it to your
home screen and check in twice a day.

## Stack

React + TypeScript + Vite, installable as a PWA (manifest, service worker, offline
caching), persisted entirely in `localStorage`. No backend.

## Data model

Goals are data, not hardcoded — see `src/types.ts`. Each goal has a `type` (one of
`weekly_count`, `daily_time`, `daily_duration`, `daily_binary`, `weekly_duration`,
`inverted_binary`), a weekday `schedule`, an active date range, and a `targets` array:
target values are versioned by date range, so editing a goal never rewrites how past
days evaluated (`src/engine/targets.ts`).

The goal engine (`src/engine/`) resolves schedules, evaluates day/week pass-fail
state, computes streaks, and generates the single push-back flag shown on Today
(`src/engine/flags.ts`) — most consequential first, never stacked.

## Views

- **Today** — only what's scheduled today, quick check-in per goal type, one flag
  if warranted, a rotating verse.
- **Week** — grid of goals × days.
- **Patterns** — sleep delta overlaid against the other goals, bed-time
  correlation, day-of-week failure rates, scrolling incidence, 8-week rolling
  completion, boxing vs. sleep, and streaks.
- **Settings** — create, edit, archive, and reactivate goals; export/import JSON.

## Development

```bash
npm install
npm run dev      # dev server
npm run build    # typecheck + production build (also builds the service worker)
npm run lint
```
