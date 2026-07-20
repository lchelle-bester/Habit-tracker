import { aggregateWeek } from './aggregateWeek'
import { addDays, isoWeekStart, weekdayOf } from './dates'
import { dailyTimeDelta, evaluateDay } from './evaluateDay'
import { entriesForGoal, entryFor, findGoalByName } from './selectors'
import type { AppData, Goal, ISODate, PushbackFlag } from './types'

type Check = (appData: AppData, today: ISODate) => PushbackFlag | null

function sleepGoalOf(appData: AppData): (Goal & { type: 'daily_time' }) | null {
  const g = findGoalByName(appData.goals, 'Sleep')
  return g && g.type === 'daily_time' ? g : null
}

/** Bedtime past target 3 nights running: the 3 most recent consecutive logged nights before today are all late. */
const checkBedtime3Nights: Check = (appData, today) => {
  const sleep = sleepGoalOf(appData)
  if (!sleep) return null

  const deltas: number[] = []
  let d = addDays(today, -1)
  for (let i = 0; i < 3; i++) {
    const entry = entryFor(appData, sleep.id, d)
    if (!entry || entry.type !== 'daily_time' || entry.actualTime == null) return null // gap: no unbroken run
    const delta = dailyTimeDelta(sleep, entry, d)
    if (delta == null) return null
    deltas.push(delta)
    d = addDays(d, -1)
  }

  if (deltas.every((delta) => delta < 0)) {
    return {
      id: 'bedtime_3_nights',
      message: 'Bedtime has been past target three nights running. Boxing usually goes next.',
      goalIds: [sleep.id],
    }
  }
  return null
}

/** Boxing below floor with exactly one scheduled day left this week — still fixable, so flag now. */
const checkBoxingFloorRisk: Check = (appData, today) => {
  const boxing = findGoalByName(appData.goals, 'Boxing')
  if (!boxing || boxing.type !== 'weekly_count') return null

  const weekStart = isoWeekStart(today)
  const agg = aggregateWeek(boxing, weekStart, entriesForGoal(appData, boxing.id), today)
  if (agg.count >= agg.floor) return null

  const remaining = boxing.schedule
    .map((wd) => {
      const offset = (wd - weekdayOf(weekStart) + 7) % 7
      return addDays(weekStart, offset)
    })
    .filter((d) => d >= today && !entryFor(appData, boxing.id, d))

  if (remaining.length === 1) {
    return {
      id: 'boxing_floor_risk',
      message: `Boxing is at ${agg.count} of the floor of ${agg.floor} with one scheduled day left this week.`,
      goalIds: [boxing.id],
    }
  }
  return null
}

/** Scripture missed 3+ consecutive days. */
const checkScriptureStreak: Check = (appData, today) => {
  const scripture = findGoalByName(appData.goals, 'Scripture')
  if (!scripture || scripture.type !== 'daily_duration') return null

  let run = 0
  let d = addDays(today, -1)
  // Bounded by activeFrom: a goal has no history before it existed, so the
  // scan must stop there rather than walking backward forever.
  while (d >= scripture.activeFrom) {
    const entry = entryFor(appData, scripture.id, d)
    const status = evaluateDay(scripture, entry, d, today)
    if (status === 'not_scheduled') {
      d = addDays(d, -1)
      continue
    }
    if (status === 'fail') {
      run++
      d = addDays(d, -1)
      if (run >= 3) {
        return {
          id: 'scripture_streak_broken',
          message: 'Scripture has been missed three days running.',
          goalIds: [scripture.id],
        }
      }
    } else {
      break
    }
  }
  return null
}

/** Scrolling rate up week-on-week, compared over the same number of elapsed days so far. */
const checkScrollingUp: Check = (appData, today) => {
  const scrolling = findGoalByName(appData.goals, 'No scrolling')
  if (!scrolling || scrolling.type !== 'inverted_binary') return null

  const thisWeekStart = isoWeekStart(today)
  const lastWeekStart = addDays(thisWeekStart, -7)
  const elapsedDays = ((weekdayOf(today) + 6) % 7) + 1 // days from Monday through today, inclusive

  const countOccurrences = (weekStart: ISODate) => {
    let count = 0
    for (let i = 0; i < elapsedDays; i++) {
      const entry = entryFor(appData, scrolling.id, addDays(weekStart, i))
      if (entry && entry.type === 'inverted_binary' && entry.occurred) count++
    }
    return count
  }

  const currentCount = countOccurrences(thisWeekStart)
  const previousCount = countOccurrences(lastWeekStart)

  if (currentCount > previousCount) {
    return {
      id: 'scrolling_up',
      message: `Scrolling logged ${currentCount} times this week so far, vs ${previousCount} at this point last week.`,
      goalIds: [scrolling.id],
    }
  }
  return null
}

/** Thursday evening with bedtime drifting: Friday's early start depends on tonight. */
const checkThursdayDrift = (appData: AppData, today: ISODate, nowMinutes?: number): PushbackFlag | null => {
  if (weekdayOf(today) !== 4) return null
  const currentMinutes = nowMinutes ?? new Date().getHours() * 60 + new Date().getMinutes()
  if (currentMinutes < 18 * 60) return null

  const sleep = sleepGoalOf(appData)
  if (!sleep) return null

  const yesterday = addDays(today, -1)
  const dayBefore = addDays(today, -2)
  const entryYesterday = entryFor(appData, sleep.id, yesterday)
  const entryDayBefore = entryFor(appData, sleep.id, dayBefore)
  if (!entryYesterday || entryYesterday.type !== 'daily_time' || entryYesterday.actualTime == null) return null
  if (!entryDayBefore || entryDayBefore.type !== 'daily_time' || entryDayBefore.actualTime == null) return null

  const deltaYesterday = dailyTimeDelta(sleep, entryYesterday, yesterday)
  const deltaDayBefore = dailyTimeDelta(sleep, entryDayBefore, dayBefore)
  if (deltaYesterday == null || deltaDayBefore == null) return null

  const drifting = deltaYesterday < deltaDayBefore && (deltaYesterday < 0 || deltaDayBefore < 0)
  if (drifting) {
    return {
      id: 'thursday_drift',
      message: "Bedtime has been drifting this week. Friday's early start depends on tonight.",
      goalIds: [sleep.id],
    }
  }
  return null
}

const CHECKS_IN_PRIORITY_ORDER: Check[] = [
  checkBedtime3Nights,
  checkBoxingFloorRisk,
  checkScriptureStreak,
  checkScrollingUp,
  checkThursdayDrift,
]

/** Returns the single highest-priority push-back flag, or null if none apply. Never returns more than one. */
export function evaluatePushbackFlags(appData: AppData, today: ISODate): PushbackFlag | null {
  for (const check of CHECKS_IN_PRIORITY_ORDER) {
    const flag = check(appData, today)
    if (flag) return flag
  }
  return null
}

export const __testables = {
  checkBedtime3Nights,
  checkBoxingFloorRisk,
  checkScriptureStreak,
  checkScrollingUp,
  checkThursdayDrift,
}
