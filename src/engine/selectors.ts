import { addDays, isWithinRange, weekdayOf } from './dates'
import { dailyTimeDelta, evaluateDay } from './evaluateDay'
import type { AppData, Entry, Goal, ISODate } from './types'

export function activeGoals(appData: AppData): Goal[] {
  return appData.goals.filter((g) => !g.archived)
}

export function goalsScheduledOn(appData: AppData, date: ISODate): Goal[] {
  return activeGoals(appData).filter(
    (g) => isWithinRange(date, g.activeFrom, g.activeTo) && g.schedule.includes(weekdayOf(date)),
  )
}

export function entriesForGoal(appData: AppData, goalId: string): Entry[] {
  return appData.entries.filter((e) => e.goalId === goalId)
}

export function entryFor(appData: AppData, goalId: string, date: ISODate): Entry | undefined {
  return appData.entries.find((e) => e.goalId === goalId && e.date === date)
}

export function findGoalByName(goals: Goal[], name: string): Goal | undefined {
  return goals.find((g) => g.name.toLowerCase() === name.toLowerCase() && !g.archived)
}

/**
 * Plain-number correlation: average completion rate across all goals on the
 * day *following* a night with an on-target Sleep log, vs the day following
 * a late Sleep log. Answers "does a late bedtime actually predict a worse
 * next day here" without needing a chart.
 */
export function correlationOnTargetVsLate(
  appData: AppData,
  todayDate: ISODate,
): {
  onTargetRate: number
  lateRate: number
  sampleSize: { onTarget: number; late: number }
} {
  const sleepGoal = findGoalByName(appData.goals, 'Sleep')
  if (!sleepGoal || sleepGoal.type !== 'daily_time') {
    return { onTargetRate: 0, lateRate: 0, sampleSize: { onTarget: 0, late: 0 } }
  }
  const typedSleepGoal = sleepGoal as Goal & { type: 'daily_time' }

  const sleepEntries = entriesForGoal(appData, sleepGoal.id).filter(
    (e): e is Entry & { type: 'daily_time' } => e.type === 'daily_time' && e.actualTime != null,
  )

  const onTargetNextDayRates: number[] = []
  const lateNextDayRates: number[] = []

  for (const sleepEntry of sleepEntries) {
    const delta = dailyTimeDelta(typedSleepGoal, sleepEntry, sleepEntry.date)
    if (delta == null) continue

    const nextDate = addDays(sleepEntry.date, 1)
    if (nextDate > todayDate) continue // next day hasn't happened yet, nothing to correlate against
    const scheduledNext = goalsScheduledOn(appData, nextDate)
    if (scheduledNext.length === 0) continue

    const passCount = scheduledNext.filter((g) => {
      const entry = entryFor(appData, g.id, nextDate)
      return evaluateDay(g, entry, nextDate, todayDate) === 'pass'
    }).length
    const rate = passCount / scheduledNext.length

    if (delta >= 0) onTargetNextDayRates.push(rate)
    else lateNextDayRates.push(rate)
  }

  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
  return {
    onTargetRate: avg(onTargetNextDayRates),
    lateRate: avg(lateNextDayRates),
    sampleSize: { onTarget: onTargetNextDayRates.length, late: lateNextDayRates.length },
  }
}
