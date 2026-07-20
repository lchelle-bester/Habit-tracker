import { aggregateWeek } from './aggregateWeek'
import { datesInRange, isoWeekStart, addDays } from './dates'
import { evaluateDay } from './evaluateDay'
import type { Entry, Goal, ISODate, StreakResult } from './types'

function longestAndCurrentRun(passes: boolean[]): { current: number; longest: number } {
  let longest = 0
  let running = 0
  for (const p of passes) {
    running = p ? running + 1 : 0
    if (running > longest) longest = running
  }
  let current = 0
  for (let i = passes.length - 1; i >= 0; i--) {
    if (!passes[i]) break
    current++
  }
  return { current, longest }
}

/**
 * Current + longest streaks for positive goal types only. Always returns
 * null for `inverted_binary` — a negative goal has no streak, ever. An
 * unlogged "today" (daily) or an in-progress current week (weekly) is
 * excluded from the trailing scan so it can't zero out `current` just
 * because it hasn't been logged/finished yet.
 */
export function computeStreak(goal: Goal, entries: Entry[], todayDate: ISODate): StreakResult | null {
  if (goal.type === 'inverted_binary') return null

  const entriesForGoal = entries.filter((e) => e.goalId === goal.id)

  if (goal.type === 'weekly_count' || goal.type === 'weekly_duration') {
    const g = goal as Goal & { type: 'weekly_count' | 'weekly_duration' }
    const firstWeek = isoWeekStart(g.activeFrom)
    const lastWeek = isoWeekStart(todayDate)
    const weekStarts: ISODate[] = []
    for (let w = firstWeek; w <= lastWeek; w = addDays(w, 7)) weekStarts.push(w)

    const statuses = weekStarts
      .map((w) => aggregateWeek(g, w, entriesForGoal, todayDate).status)
      .filter((s) => s !== 'pending')
    const passes = statuses.map((s) => s === 'full' || s === 'floor')
    const { current, longest } = longestAndCurrentRun(passes)
    return { current, longest, unit: 'week' }
  }

  const days = datesInRange(goal.activeFrom, todayDate)
  const entryByDate = new Map(entriesForGoal.map((e) => [e.date, e]))
  const statuses = days
    .map((d) => evaluateDay(goal, entryByDate.get(d), d, todayDate))
    .filter((s) => s !== 'not_scheduled' && s !== 'pending')
  const passes = statuses.map((s) => s === 'pass')
  const { current, longest } = longestAndCurrentRun(passes)
  return { current, longest, unit: 'day' }
}
