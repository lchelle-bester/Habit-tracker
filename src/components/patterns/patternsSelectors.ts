import { addDays, isoWeekStart, weekdayOf } from '../../engine/dates'
import { aggregateWeek } from '../../engine/aggregateWeek'
import { datesInRange } from '../../engine/dates'
import { evaluateDay } from '../../engine/evaluateDay'
import type { Entry, Goal, ISODate } from '../../engine/types'

/**
 * A day's rough "went well / didn't" for chart purposes — a daily proxy even
 * for weekly-unit goals (Boxing, Reading), since every Patterns chart in
 * this app plots at daily granularity. Returns null when the day isn't part
 * of the goal's story at all (not scheduled, or still pending).
 */
export function dailySuccessProxy(goal: Goal, entry: Entry | undefined, date: ISODate, todayDate: ISODate): boolean | null {
  if (goal.type === 'weekly_count') {
    if (!goal.schedule.includes(weekdayOf(date))) return null
    if (entry && entry.type === 'weekly_count') return entry.done
    return date < todayDate ? false : null
  }
  if (goal.type === 'weekly_duration') {
    if (!goal.schedule.includes(weekdayOf(date))) return null
    if (entry && entry.type === 'weekly_duration') return entry.actualMinutes != null
    return date < todayDate ? false : null
  }
  const status = evaluateDay(goal, entry, date, todayDate)
  if (status === 'not_scheduled' || status === 'pending') return null
  return status === 'pass'
}

const WEEKS = 8

/** Ratio (0..1) of completion per week over the last 8 weeks, or null for weeks with no relevant data. */
export function weeklyCompletionRatios(goal: Goal, entries: Entry[], todayDate: string): (number | null)[] {
  const entriesForGoal = entries.filter((e) => e.goalId === goal.id)
  const currentWeekStart = isoWeekStart(todayDate)
  const weekStarts = Array.from({ length: WEEKS }, (_, i) => addDays(currentWeekStart, -(WEEKS - 1 - i) * 7))

  return weekStarts.map((weekStart) => {
    if (weekStart < isoWeekStart(goal.activeFrom)) return null

    if (goal.type === 'weekly_count' || goal.type === 'weekly_duration') {
      const agg = aggregateWeek(goal as Goal & { type: 'weekly_count' | 'weekly_duration' }, weekStart, entriesForGoal, todayDate)
      // A week still in progress isn't a result yet — plotting it as a low
      // ratio would misrepresent an early-week dip as a finished bad week.
      if (agg.status === 'pending' || agg.target === 0) return null
      return Math.min(agg.count / agg.target, 1)
    }

    const weekDates = datesInRange(weekStart, addDays(weekStart, 6))
    const entryByDate = new Map(entriesForGoal.map((e) => [e.date, e]))
    const statuses = weekDates.map((d) => evaluateDay(goal, entryByDate.get(d), d, todayDate)).filter((s) => s !== 'not_scheduled')
    const relevant = statuses.filter((s) => s !== 'pending')
    if (relevant.length === 0) return null
    return relevant.filter((s) => s === 'pass').length / relevant.length
  })
}
