import { isWithinRange, timeToMinutes, weekdayOf } from './dates'
import { resolveTargetVersion } from './targetResolution'
import type { DayStatus, Entry, Goal, ISODate } from './types'

/**
 * Minutes early (positive) or late (negative) that `actual` is relative to
 * `target`. Targets are evening bedtimes, so an actual time logged just after
 * midnight (e.g. 00:20) must read as ~65 minutes late against a 23:00
 * target, not as "on time" because 00:20 is numerically small. We anchor
 * this by treating any actual time before noon as having rolled past
 * midnight whenever the target itself is an evening time (hour >= 18).
 */
export function clockTimeDeltaMinutes(target: string, actual: string): number {
  const targetMin = timeToMinutes(target)
  let actualMin = timeToMinutes(actual)
  const targetHour = Math.floor(targetMin / 60)
  if (targetHour >= 18 && actualMin < 12 * 60) actualMin += 24 * 60
  return targetMin - actualMin
}

function isScheduledOn(goal: Goal, date: ISODate): boolean {
  if (!isWithinRange(date, goal.activeFrom, goal.activeTo)) return false
  return goal.schedule.includes(weekdayOf(date))
}

/**
 * Evaluates a single day's entry for a daily-unit goal type against the
 * target version in force on that date. `weekly_count`/`weekly_duration`
 * entries are raw occurrences here — their pass/fail is a weekly concept,
 * handled by aggregateWeek.ts.
 */
export function evaluateDay(goal: Goal, entry: Entry | undefined, date: ISODate, todayDate: ISODate): DayStatus {
  if (!isScheduledOn(goal, date)) return 'not_scheduled'

  switch (goal.type) {
    case 'daily_binary': {
      if (!entry) return date >= todayDate ? 'pending' : 'fail'
      return (entry as Entry & { type: 'daily_binary' }).done ? 'pass' : 'fail'
    }
    case 'inverted_binary': {
      // Absence of a logged entry is the default success state for a negative
      // goal — but only for today-or-past. A future day hasn't happened yet
      // and must not already count as a "clean" day in any rate/streak calc.
      if (!entry) return date > todayDate ? 'pending' : 'pass'
      return (entry as Entry & { type: 'inverted_binary' }).occurred ? 'fail' : 'pass'
    }
    case 'daily_duration': {
      const e = entry as (Entry & { type: 'daily_duration' }) | undefined
      if (e?.actualMinutes == null) return date >= todayDate ? 'pending' : 'fail'
      const version = resolveTargetVersion(goal as Goal & { type: 'daily_duration' }, date)
      if (!version) return 'not_scheduled'
      return e.actualMinutes >= version.targetMinutes ? 'pass' : 'fail'
    }
    case 'daily_time': {
      const e = entry as (Entry & { type: 'daily_time' }) | undefined
      if (e?.actualTime == null) return date >= todayDate ? 'pending' : 'fail'
      const version = resolveTargetVersion(goal as Goal & { type: 'daily_time' }, date)
      if (!version) return 'not_scheduled'
      const targetTime = version.overrides?.[weekdayOf(date)] ?? version.defaultTime
      const delta = clockTimeDeltaMinutes(targetTime, e.actualTime)
      return delta >= 0 ? 'pass' : 'fail'
    }
    case 'weekly_count':
    case 'weekly_duration':
      // Not evaluated per-day; callers use aggregateWeek for these types.
      return 'not_scheduled'
  }
}

/** Convenience for the Today view: the target-vs-actual delta in minutes for a daily_time goal, or null if unlogged/unscheduled. */
export function dailyTimeDelta(goal: Goal & { type: 'daily_time' }, entry: Entry | undefined, date: ISODate): number | null {
  const e = entry as (Entry & { type: 'daily_time' }) | undefined
  if (e?.actualTime == null) return null
  const version = resolveTargetVersion(goal, date)
  if (!version) return null
  const targetTime = version.overrides?.[weekdayOf(date)] ?? version.defaultTime
  return clockTimeDeltaMinutes(targetTime, e.actualTime)
}
