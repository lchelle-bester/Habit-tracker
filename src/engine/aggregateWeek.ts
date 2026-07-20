import { addDays, isWithinRange, weekdayOf } from './dates'
import { resolveTargetVersion } from './targetResolution'
import type { Entry, Goal, ISODate, WeekAggregate } from './types'

function scheduledDatesInWeek(goal: Goal, weekStart: ISODate): ISODate[] {
  const dates: ISODate[] = []
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i)
    if (isWithinRange(d, goal.activeFrom, goal.activeTo) && goal.schedule.includes(weekdayOf(d))) {
      dates.push(d)
    }
  }
  return dates
}

/**
 * Aggregates a Monday-start week for `weekly_count` / `weekly_duration`
 * goals into a tri-state status. `'pending'` covers a week still in
 * progress where the floor is still mathematically reachable — this keeps
 * an in-progress week from flashing a false 'fail' on day two.
 */
export function aggregateWeek(
  goal: Goal & { type: 'weekly_count' | 'weekly_duration' },
  weekStart: ISODate,
  entriesForGoal: Entry[],
  todayDate: ISODate,
): WeekAggregate {
  const scheduledDates = scheduledDatesInWeek(goal, weekStart)
  const entryByDate = new Map(entriesForGoal.map((e) => [e.date, e]))

  const version = resolveTargetVersion(goal as Goal & { type: typeof goal.type }, weekStart)

  // No target version has ever governed this week (it predates the goal's
  // first version) — there is nothing to judge, so exclude it rather than
  // vacuously reporting 'full' against a target of 0.
  if (!version) {
    return { weekStart, count: 0, target: 0, floor: 0, status: 'pending' }
  }

  let count = 0
  let target = 0
  let floor = 0

  if (goal.type === 'weekly_count') {
    const v = version as { target: number; floor?: number } | null
    target = v?.target ?? 0
    floor = v?.floor ?? target
    count = scheduledDates.filter((d) => {
      const e = entryByDate.get(d) as (Entry & { type: 'weekly_count' }) | undefined
      return e?.done === true
    }).length
  } else {
    const v = version as { targetMinutes: number } | null
    target = v?.targetMinutes ?? 0
    floor = target
    count = scheduledDates.reduce((sum, d) => {
      const e = entryByDate.get(d) as (Entry & { type: 'weekly_duration' }) | undefined
      return sum + (e?.actualMinutes ?? 0)
    }, 0)
  }

  const weekEnd = addDays(weekStart, 6)
  const remainingScheduled = scheduledDates.filter((d) => d >= todayDate && !entryByDate.has(d)).length

  // weekly_count: each remaining scheduled day can contribute at most one
  // occurrence, so the floor is only still reachable if count + remaining
  // days covers it. weekly_duration has no per-day ceiling, so as long as
  // any scheduled day remains unlogged, the floor is still reachable.
  const canStillReachFloor =
    goal.type === 'weekly_count' ? count + remainingScheduled >= floor : remainingScheduled > 0

  let status: WeekAggregate['status']
  if (count >= target) status = 'full'
  else if (count >= floor) status = 'floor'
  else if (todayDate > weekEnd || !canStillReachFloor) status = 'fail'
  else status = 'pending'

  return { weekStart, count, target, floor, status }
}
